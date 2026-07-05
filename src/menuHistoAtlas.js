/** 
 * Column ordering
 */
const ORDER = {
  DESC : "desc",
  CRES : "crec"
};

/** 
 * Tables types 
 */
const TABLESTYPE = {
  MYMAPS : "mymaps",
  FEACTUREDMAPS : "feacturedmaps",
  PUBLICMAPS : "publicmaps",
}

/**
 * Class for manage the menu (views liste of maps, descrition, ...)
 */
class MenuHistoAtlas
{
  constructor() 
  {

  }

  /**
   * Init the menu
   */
  init()
  {
    let self = this;

    // @property {MapData[]}                      publicMaps                     The maps data
    self.publicMaps = [];
    // @property {MapData[]}                      userMaps                       The users maps data
    self.userMaps = [];

    // Gestion des images (description)
    self.imgNumber = 1;
    self.listImages = ["", "map_rome.png", "map_ww1_alliance.png", "map_ww1.png", "rome_edit.png", "spain.png", "rome_mapbox.png"];

    // Load maps file and display all
    let lang = "en";

    if(Config.getCookie("lang"))
    {
      lang = Config.getCookie("lang");
    }
    let params = Config.getUrlParams();
    if(params["lang"])
    {
      lang = params["lang"];
    }

    // Hide your map if not connected
    if(!localStorage.getItem('session-id-histoatlas')) {
      $("#user-maps-div").css("display", "none");
    }

    // Hide description of the wrong language 
    $("#view-description").on("click", (event) => {
      $("#view-description").css("display", "none");
      if(lang == "fr") {
        $("#description_fr").css("display", "inline-block");
      }
      else {
        $("#description_en").css("display", "inline-block");
      }
      //
      $(".img-frame").css("display", "flex");
    });

    // Load the config and init menu
    Config.load().then((config) =>
    {
      Dictionary.load(lang, "", function()
      {
        Menu.init(lang);

        let urlArray = window.location.href.split("/");
        urlArray.pop();
        const websiteUrl = urlArray.join("/");

        // Check if user is connected
        if(localStorage.getItem('session-id-histoatlas'))
        {
          Utils.callServer("user/checkValidUser", "GET", {}).then((result) => 
          {
            let user = localStorage.getItem('session-id-histoatlas');
            self.getUserMap(user);
            self.getServerMaps(user);
            self.displayUser(user);

          }).catch((err) => { 
            localStorage.removeItem('session-id-histoatlas');
            localStorage.removeItem('session-token-histoatlas');
              
            self.getServerMaps(null);
          });
        }
        else
        {
          self.getServerMaps(null);
        }

        self.manageImages();
        self.manageMenuLinkFrame();
        self.manageConnexionButton();
      });
    });
  }

  /**
   * Get all visible maps for user on server (all if not connected)
   * @property {String}                      user                       The user name
   */
  getServerMaps(user)
  {
    let self = this;
    Utils.callServer("map/getVisibleMaps/" + user, "GET", {}).then((response) => 
    {
      let publicMaps = [];
      for(let i = 0; i < response.publicMaps.length; i++)
      {
        publicMaps.push(new MapData());
        publicMaps[i].fromJson(response.publicMaps[i]);
      }
      self.publicMaps = publicMaps;
      self.displayPublicMap();
    }).catch((err) => 
    { 
      if(typeof err === 'object' && !Array.isArray(err) && err !== null) 
      {
        if(err.responseJSON != undefined)
          toastr.error(Dictionary.get(err.responseJSON.error), Dictionary.get('INDEX_MAP_RECOVER_FAIL'));
        else 
          toastr.error(Dictionary.get(err.message), Dictionary.get('INDEX_MAP_RECOVER_FAIL'));
      }
      else 
        toastr.error(err, Dictionary.get('INDEX_MAP_RECOVER_FAIL'));
    });
  }

  /* 
   * Get users map on server
   * @property {String}                      user                       The user name
   */
  getUserMap(user)
  {
    let self = this;
    Utils.callServer("map/getVisibleMapsOfUser/" + user, "GET", {}).then((response) => 
    {
      let userMaps = [];
      for(let i = 0; i < response.userMaps.length; i++)
      {
        userMaps.push(new MapData());
        userMaps[i].fromJson(response.userMaps[i]);
      }
      self.userMaps = userMaps;
      self.displayUserMap();
    }).catch((err) => 
    { 
      if(typeof err.responseJSON === 'object' && !Array.isArray(err.responseJSON) && err.responseJSON !== null) 
      {
        toastr.error(Dictionary.get(err.responseJSON.error), Dictionary.get('MENU_MAP_RECOVER_FAIL'));
      }
      else 
      {
        toastr.error(err.message, Dictionary.get('MENU_MAP_RECOVER_FAIL'));
      }
    });
  }

  /**
   * Add a new column
   * @property {JqueryElement}           jqueryTRElement          Parent element
   * @property {string}                  id                       Id of the column
   * @property {string}                  className                Class of the column
   * @property {string}                  text                     Text of the column
   * @property {string}                  orderEnable              True if the column can be sort
   * @property {TABLESTYPE}              tabStr                   Type parent div maps (user, feactured or public)
   */
  addColumnTitle(jqueryTRElement, id, className, text, orderEnable, tabStr)
  {
    let self = this;

    if(orderEnable) 
    {
      let icon = ``;

      var order = localStorage.getItem(id);
      if(order == ORDER.DESC) {
        icon = `<i class="fa-solid fa-angle-up" style="margin-left:3px;"></i>`;
      }
      else if(order == ORDER.CRES) {
        icon = `<i class="fa-solid fa-angle-down" style="margin-left:3px;"></i>`;
      }

      jqueryTRElement.append(`<th id="${id}" class="title-column ${className}"><span>${text}</span>${icon}</th>`);

      // Manage click in the column = update maps order
      $("#"+id).on("click", (e) => 
      {
        if(tabStr == TABLESTYPE.MYMAPS)
        {
          if(e.delegateTarget.id != "title-column-mymaps-lang") 
            localStorage.setItem("title-column-mymaps-lang", "");
          if(e.delegateTarget.id != "title-column-mymaps-type") 
            localStorage.setItem("title-column-mymaps-type", "");
          if(e.delegateTarget.id != "title-column-mymaps-title") 
            localStorage.setItem("title-column-mymaps-title", "");
          if(e.delegateTarget.id != "title-column-mymaps-edit") 
            localStorage.setItem("title-column-mymaps-edit", "");
          if(e.delegateTarget.id != "title-column-mymaps-creation-date") 
            localStorage.setItem("title-column-mymaps-creation-date", "");
          if(e.delegateTarget.id != "title-column-mymaps-edit-date") 
            localStorage.setItem("title-column-mymaps-edit-date", "");
        }
        else if(tabStr == TABLESTYPE.PUBLICMAPS) 
        {
          if(e.delegateTarget.id != "title-column-publicmaps-lang") 
            localStorage.setItem("title-column-publicmaps-lang", "");
          if(e.delegateTarget.id != "title-column-publicmaps-type") 
            localStorage.setItem("title-column-publicmaps-type", "");
          if(e.delegateTarget.id != "title-column-publicmaps-title") 
            localStorage.setItem("title-column-publicmaps-title", "");
          if(e.delegateTarget.id != "title-column-publicmaps-creator") 
            localStorage.setItem("title-column-publicmaps-creator", "");
          if(e.delegateTarget.id != "title-column-publicmaps-creation-date") 
            localStorage.setItem("title-column-publicmaps-creation-date", "");
          if(e.delegateTarget.id != "title-column-publicmaps-edit-date") 
            localStorage.setItem("title-column-publicmaps-edit-date", "");
        }
        else if(tabStr == TABLESTYPE.FEACTUREDMAPS) 
        {
          if(e.delegateTarget.id != "title-column-feacturemaps-lang") 
            localStorage.setItem("title-column-feacturemaps-lang", "");
          if(e.delegateTarget.id != "title-column-feacturemaps-type") 
            localStorage.setItem("title-column-feacturemaps-type", "");
          if(e.delegateTarget.id != "title-column-feacturemaps-title") 
            localStorage.setItem("title-column-feacturemaps-title", "");
          if(e.delegateTarget.id != "title-column-feacturemaps-creator") 
            localStorage.setItem("title-column-feacturemaps-creator", "");
          if(e.delegateTarget.id != "title-column-feacturemaps-creation-date") 
            localStorage.setItem("title-column-feacturemaps-creation-date", "");
          if(e.delegateTarget.id != "title-column-feacturemaps-edit-date") 
            localStorage.setItem("title-column-feacturemaps-edit-date", "");
        }

        var order = localStorage.getItem(e.delegateTarget.id);

        // Save column order
        if(order == null || order == undefined || order == ORDER.DESC) {
          localStorage.setItem(e.delegateTarget.id, ORDER.CRES);
        }
        else {
          localStorage.setItem(e.delegateTarget.id, ORDER.DESC);
        }

        // Update maps display
        if(tabStr == TABLESTYPE.MYMAPS) 
        {
          self.displayUserMap();
        }
        else 
        {
          self.displayPublicMap();
        }
      });
    }
    else if(id != "") {
      jqueryTRElement.append(`<th id="${id}" class="title-column ${className}">${text}</th>`);
    }
    else {
      jqueryTRElement.append(`<th class="${className}">${text}</th>`);
    }
  }

  /**
   * Display maps of user with visibility/editions buttons
   */
  displayUserMap()
  {
    let self = this;

    let titres = `<tr id="titles-mymaps-table" class="titles-map-table"></tr>`;
    $("#user-maps").html(titres);

    // Add columns
    let jqueryTRElement = $("#titles-mymaps-table");
    self.addColumnTitle(jqueryTRElement, "title-column-mymaps-lang", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_LANG'), true, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "title-column-mymaps-type", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CATEGORY'), true, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "title-column-mymaps-title", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_NAME'), true, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "title-column-mymaps-edit", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_EDITION'), false, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "title-column-mymaps-creation-date", "creation-date-col", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CREATION'), true, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "title-column-mymaps-edit-date", "edition-date-col", Dictionary.get('INDEX_MAP_ARRAY_TITLE_MODIF'), true, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "", "", "", false, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "", "", "", false, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "", "edition-col", "", false, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "", "", "", false, TABLESTYPE.MYMAPS);
    self.addColumnTitle(jqueryTRElement, "", "iframe-col", "", false, TABLESTYPE.MYMAPS);

    // Manage order maps
    self.orderArrayMaps("title-column-mymaps-lang", self.userMaps, "lang", true);
    self.orderArrayMaps("title-column-mymaps-type", self.userMaps, "category", true);
    self.orderArrayMaps("title-column-mymaps-title", self.userMaps, "name", true);
    self.orderArrayMaps("title-column-mymaps-creation-date", self.userMaps, "creationDate", false);
    self.orderArrayMaps("title-column-mymaps-edit-date", self.userMaps, "updateDate", false);

    // Display maps
    let userMaps = [];
    for(let i = 0; i < self.userMaps.length; i++)
    {
      userMaps.push(new MenuMapFrame(self.userMaps[i], "user-maps", i, true));
    }
  }

  /**
   * Display public maps and feactures maps
   */
  displayPublicMap()
  {
    let self = this;

    let titresPublicMaps = `<tr id="titles-public-maps-table" class="titles-map-table"></tr>`;
    let titresFeaturedMaps = `<tr id="titles-featured-maps-table" class="titles-map-table"></tr>`;
    $("#public-maps").html(titresPublicMaps);
    $("#featured-maps").html(titresFeaturedMaps);

    // Add columns for public maps
    let jqueryTRElementPublicMaps = $("#titles-public-maps-table");
    self.addColumnTitle(jqueryTRElementPublicMaps, "title-column-publicmaps-lang", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_LANG'), true, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "title-column-publicmaps-type", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CATEGORY'), true, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "title-column-publicmaps-title", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_NAME'), true, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "title-column-publicmaps-creator", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CREATOR'), true, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "title-column-publicmaps-creation-date", "creation-date-col", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CREATION'), true, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "title-column-publicmaps-edit-date", "edition-date-col", Dictionary.get('INDEX_MAP_ARRAY_TITLE_MODIF'), true, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "", "", "", false, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "", "", "", false, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "", "edition-col", "", false, TABLESTYPE.PUBLICMAPS);
    self.addColumnTitle(jqueryTRElementPublicMaps, "", "iframe-col", "", false, TABLESTYPE.PUBLICMAPS);

    // Add columns for featured maps
    let jqueryTRElementFeaturedMaps = $("#titles-featured-maps-table");
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "title-column-feacturemaps-lang", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_LANG'), true, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "title-column-feacturemaps-type", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CATEGORY'), true, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "title-column-feacturemaps-title", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_NAME'), true, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "title-column-feacturemaps-creator", "", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CREATOR'), true, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "title-column-feacturemaps-creation-date", "creation-date-col", Dictionary.get('INDEX_MAP_ARRAY_TITLE_CREATION'), true, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "title-column-feacturemaps-edit-date", "edition-date-col", Dictionary.get('INDEX_MAP_ARRAY_TITLE_MODIF'), true, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "", "", "", false, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "", "", "", false, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "", "edition-col", "", false, TABLESTYPE.FEACTUREDMAPS);
    self.addColumnTitle(jqueryTRElementFeaturedMaps, "", "iframe-col", "", false, TABLESTYPE.FEACTUREDMAPS);

    let publicMaps = [];
    let feacturedMaps = [];
    for(let i = 0; i < self.publicMaps.length; i++) 
    {
      if(self.publicMaps[i].topVisibility) {
        feacturedMaps.push(self.publicMaps[i]);
      }
      else {
        publicMaps.push(self.publicMaps[i]);
      }
    }

    // Manage order public maps
    self.orderArrayMaps("title-column-publicmaps-lang", publicMaps, "lang", true);
    self.orderArrayMaps("title-column-publicmaps-type", publicMaps, "category", true);
    self.orderArrayMaps("title-column-publicmaps-title", publicMaps, "name", true);
    self.orderArrayMaps("title-column-publicmaps-creator", publicMaps, "userName", true);
    self.orderArrayMaps("title-column-publicmaps-creation-date", publicMaps, "creationDate", false);
    self.orderArrayMaps("title-column-publicmaps-edit-date", publicMaps, "updateDate", false);

    // Manage order feactured maps
    self.orderArrayMaps("title-column-feacturemaps-lang", feacturedMaps, "lang", true);
    self.orderArrayMaps("title-column-feacturemaps-type", feacturedMaps, "category", true);
    self.orderArrayMaps("title-column-feacturemaps-title", feacturedMaps, "name", true);
    self.orderArrayMaps("title-column-feacturemaps-creator", feacturedMaps, "userName", true);
    self.orderArrayMaps("title-column-feacturemaps-creation-date", feacturedMaps, "creationDate", false);
    self.orderArrayMaps("title-column-feacturemaps-edit-date", feacturedMaps, "updateDate", false);

    //  Display list of public maps and feactures maps
    let feacturedMapsObj = [];
    for(let i = 0; i < feacturedMaps.length; i++)
    {
      feacturedMapsObj.push(new MenuMapFrame(feacturedMaps[i], "featured-maps", false));
    }
    let publicMapsObj = [];
    for(let i = 0; i < publicMaps.length; i++)
    {
      publicMapsObj.push(new MenuMapFrame(publicMaps[i], "public-maps", false));
    }
  }

  /**
   * Manage sort maps
   * @param {String}         key              Key of the sort (localstorage)
   * @param {MapData[]}      mapsArray        Array of maps
   * @param {String}         propName         Name of the sort property
   * @param {boolean}        isText           If is a text property
   * @return {MapData[]}                      Ordered maps
   */
  orderArrayMaps(key, mapsArray, propName, isText)
  {
    var order = localStorage.getItem(key);
    if(order == ORDER.CRES) {
      if(isText)
        mapsArray.sort((a, b) => a[propName].localeCompare(b[propName]));
      else
        mapsArray.sort((a, b) => a[propName] - b[propName]);
    }
    else if(order == ORDER.DESC) {
      if(isText)
        mapsArray.sort((a, b) => b[propName].localeCompare(a[propName]));
      else 
      mapsArray.sort((a, b) => b[propName] - a[propName]);
    }
    return mapsArray;
  }

  /**
   * Display user informations (If an user is connected)
   * @param {String}                      user                       The user name
   */ 
  displayUser(user)
  {
    $("#connexion-div").html(`<h3 id="user-name-logged-in">${user}</h3><button id="logout" class="button-loggin">${Dictionary.get('INDEX_LOGOUT')}</button><a href="pages/profile.html"><button id="profile" class="button-loggin">${Dictionary.get('INDEX_PROFIL')}</button></a>`);
    $("#registration-button").css("display", "none");

    $("#logout").on("click",function() 
    {
      localStorage.removeItem('session-token-histoatlas');
      localStorage.removeItem('session-id-histoatlas');

      document.location.href="index.html";
    });
  }

  /**
   * Display and manage connexion/inscription buttons
   */
  manageConnexionButton() 
  {
    let self = this;

    $("#connexion-button").on("click",function() 
    {
      let content = "";
      content += `<label for="user-name" class="user-name-label">${Dictionary.get('INDEX_USER_NAME')}</label><input id="user-name" class="input-text" type="text"></input>
      <label for="user-password" class="user-password-label">${Dictionary.get('INDEX_USER_PASSWORD')}</label><input id="user-password" class="input-text" type="password"></input>
      <button id="login" class="button-loggin">${Dictionary.get('INDEX_USER_CONNEXION')}</button>
      <button id="cancel-login" class="button-loggin">${Dictionary.get('INDEX_CANCEL')}</button>
      <a href="pages/forgotPassword.html" class="forgot-password">${Dictionary.get('INDEX_FORGOT_PASSWORD')}</a>`;

      $("#connexion-div").html(content);

      // Cancel login action
      $("#cancel-login").on("click",function() 
      {
        document.location.href="index.html";
      });

      // Login on enter il focus
      $(window).on("keypress", function (e) {
        if(e.which == 13) {
          e.preventDefault()
          if (document.activeElement.id == "user-password" || document.activeElement.id == "user-name") {
            self.login();
          }
        }
      })

      // Manage click on login button
      $("#login").on("click", function() 
      {
        self.login();
      });
    });
  }

  /**
   * Call login API
   */
  login()
  {
    let name = $("#user-name").val();
    let password = $("#user-password").val();

    Utils.callServer("user/login", "POST", {name : name, password : password}).then((response) => 
    {
      localStorage.setItem('session-token-histoatlas', response.token);
      localStorage.setItem('session-id-histoatlas', response.userId);

      document.location.href="index.html";
    }).catch((err) => 
    { 
      toastr.error(Dictionary.get(err.responseJSON.error), Dictionary.get('INDEX_LOGIN_UNABLE'));
    });
  }

  /**
   * Display and manage the link frame button
   */
  manageMenuLinkFrame() 
  {
    let linkVersion = "pages/version10.html";
    let linkPresentation = "http://datavizdev.fr";
    if(Dictionary.lang == "en")
    {
      linkVersion = "pages/version10_en.html";
      linkPresentation = "http://datavizdev.fr";
    }

    // Add links frames
    new MenuLinkFrame("index-links", "img/menu/question-circle-solid.svg", Dictionary.get('INDEX_HELP_MENU'), `files/HistoAtlas_Help_${Dictionary.lang}.pdf`);
    new MenuLinkFrame("index-links", "img/menu/youtube-brands.svg", Dictionary.get('INDEX_VIDEO_LINK_TEXT'), "https://www.youtube.com/channel/UCVuK-EYlX5qDi8KaOtUQ8JQ");
    new MenuLinkFrame("index-links", "img/menu/calendar-alt-solid.svg", Dictionary.get('INDEX_VERSION_LINK_TEXT') + "10", linkVersion);
    new MenuLinkFrame("index-links", "img/menu/envelope-solid.svg", Dictionary.get('INDEX_CONTACT_LINK_TEXT'), "pages/contact.html", Dictionary.get('INDEX_CONTACT_LINK_DESCRIPTION'));
    new MenuLinkFrame("index-links", "img/menu/hands-helping-solid.svg", Dictionary.get('INDEX_SUPPORT_LINK_TEXT'), "pages/support.html");
    new MenuLinkFrame("index-links", "img/menu/git-hub.png", Dictionary.get('INDEX_SOURCE_CODE_LINK_TEXT'), "https://github.com/shevekk/Historical-Atlas");
    new MenuLinkFrame("index-links", "img/menu/circle-user-solid.svg", Dictionary.get('INDEX_CREATOR_LINK_TEXT'), linkPresentation);

    // Init text from Dictionnary
    $("#user-maps-title").html(Dictionary.get('INDEX_USER_MAPS_TITLE'));
    $("#public-maps-title").html(Dictionary.get('INDEX_PUBLIC_MAPS_TITLE'));
    $("#create_empty_map").html(Dictionary.get('INDEX_BOUTON_CREATE_NEW_MAP'));
    $("#featured-maps-title").html(Dictionary.get('INDEX_FEACTURED_MAPS_TITLE'));

    $("#connexion-button").html(Dictionary.get('INDEX_CONNEXION'));
    $("#registration-button").html(Dictionary.get('INDEX_REGISTRATION'));
    $("#cancel-button").html(Dictionary.get('INDEX_CANCEL'));

    $("#follow").html(Dictionary.get('INDEX_FOLLOW_PROJET'));
    $("#newsletter-follow-desc").html(Dictionary.get('INDEX_FOLLOW_GET_NEWSLETTER'));
    $("#mail-newsletter-follow-label").html(Dictionary.get('INDEX_FOLLOW_YOUR_MAIL'));
    $("#follow-newsletter-send").html(Dictionary.get('INDEX_FOLLOW_SEND'));

    // Links management
    let fileName = "config/links.json"
    let jqxhr = $.getJSON(fileName, null)
    .done(function(content)
    {
      $("#link-follow-twitter").attr("href", content.twitter);
      $("#link-follow-facebook").attr("href", content.facebook);
      $("#link-follow-discord").attr("href", content.discord);

      $("#link-bottom-twitter").attr("href", content.twitter);
      $("#link-bottom-facebook").attr("href", content.facebook);
      $("#link-bottom-discord").attr("href", content.discord);
      $("#link-bottom-youtube").attr("href", content.youtube);
      $("#link-bottom-gitHub").attr("href", content.gitHub);
    })
    .fail(function(d, textStatus, error)
    {
      console.error("JSON lINKS failed, status: " + textStatus + ", error: " + error);
    });

    // Newsletter div management
    $("#follow").on("click",function()
    {
      $("#follow-div").css("display", "block"); 
      $("#follow").css("display", "none"); 

      $('#lang-newsletter-follow-' + lang).prop("checked", true);
    });

    // Add a new entry in newsletters
    $("#follow-newsletter-send").on("click",() => 
    {
      let mailNewsletter = $("#mail-newsletter-follow").val();

      const exp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if(exp.test(mailNewsletter))
      {
        let selectLang = "";
        $('input[name="lang-newsletter-follow"]').each(function() {
          if(this.checked)
          {
            selectLang = this.value;
          }
        });

        let dataAddNewsletter = {};
        dataAddNewsletter["lang"] = selectLang;
        dataAddNewsletter["mail"] = mailNewsletter;

        Utils.callServer('user/addNewsletterMail', "POST", dataAddNewsletter).then(() => {
          toastr.success(Dictionary.get("INDEX_FOLLOW_SUCCESS"), "");
        })
        .catch(err => { toastr.error(Dictionary.get(err.responseJSON.error), Dictionary.get("INDEX_FOLLOW_FAIL"));});
      }
      else
      {
        toastr.error(Dictionary.get('REGISTRATION_UNABLE_MAIL_INVALID'), Dictionary.get("INDEX_FOLLOW_FAIL"));
      }
    });
  }

  /** 
   * Manage description images buttons
   */
  manageImages()
  {
    let self = this;

    // Manage change image
    $("#img-change-left").on("click", e => {
      self.changeImage(false);
    });
    $("#img-change-right").on("click",e => {
      self.changeImage(true);
    });
  }

  /**
   * Change the displayed image
   * @param {boolean}             rightChange           True if click in right button, Falsr if click in left button
   */
  changeImage(rightChange) 
  {
    let self = this;
    if(rightChange) {
      self.imgNumber ++;

      if(self.imgNumber >= self.listImages.length) {
        self.imgNumber = 1;
      }
    }
    else {
      self.imgNumber --;

      if(self.imgNumber < 1) {
        self.imgNumber = self.listImages.length - 1;
      }
    }

    // Change image
    $("#img-change-content-images").attr("src", `img/captures/${self.listImages[self.imgNumber]}`);
  }
}