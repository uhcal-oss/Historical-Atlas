
/*
 * Manage Save and Load actions
 */
class LoadSaveManager
{
  /* 
   * Initialize the LoadSaveManager
   * @property {L.Map}                      map                      The map
   * @property {LayerManager}               layersManager            The layers manager
   * @property {Param}                      params                   Application params
   * @property {BackgroundControl}          backgroundControl        The background controller
   * @property {TimeControl}                timeControl              The time control
   * @property {LayersControl}              layersControl            The layers control
   * @property {Boolean}                    logged                   The logged state 
   * @property {ActionsList}                actionsList              Manager of action list and undo/redo
   * @property {DescriptionManager}         descriptionManager       The manager for display description in pop-up
   * @property {ActionsControl}             actionsControl           The action control
   * @property {SaveFrameControl}           saveFrameControl         The frame for save
   * @property {Object}                     jsonBackgrounds          The json background
   */
  constructor(map, layersManager, params, backgroundControl, timeControl, layersControl, actionsList, descriptionManager, saveFrameControl, jsonBackgrounds)
  {
    this.map = map;
    this.layersManager = layersManager;
    this.layersControl = layersControl;
    this.actionsControl = null;
    this.params = params;
    this.backgroundControl = backgroundControl;
    this.jsonBackgrounds = jsonBackgrounds;
    this.timeControl = timeControl;
    this.actionsList = actionsList;
    this.descriptionManager = descriptionManager;
    this.saveFrameControl = saveFrameControl;

    if(localStorage.getItem('session-id-histoatlas'))
    {
      this.logged = false;
    }
    else
    {
      //this.logged = true;
      this.logged = false;
    }

    this.initLoginDialog();
  }

  /*
   * Export actual representation to a json file
   */
  export()
  {
    let content = {};

    content = this.params.toJson(content);
    content = this.layersManager.toJson(content);
    content = PropertiesForm.toJson(content);

    let fileName = "export.json";

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(content)));
    element.setAttribute('download', fileName);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

 /*
  * Load a json file
  */
  importManagement(me)
  {
    //let me = this;

    var fileInput = document.getElementById("inputImportFile"),
    readFile = function () {
      var reader = new FileReader();
      reader.fileName = document.getElementById("inputImportFile").files[0];
      reader.onload = function (readerEvt) 
      {
        me.actionsList.addActionLoadJson(me);

        var isJsonFile = reader.fileName.name.endsWith(".json");
        
        if(isJsonFile)
        {
          let fileContent = reader.result;
          let contentObj = JSON.parse(fileContent);

          if(contentObj.layers)
          {
            me.initParamsFromData(contentObj)
            me.initMapFromData(contentObj);
          }
          else
          {
            alert(Dictionary.get("MAP_SAVEANDLOAD_IMPORTFILE_INVALID"));
          }
        }
        else
        {
          alert(Dictionary.get("MAP_SAVEANDLOAD_IMPORTFILE_FORMAT_JSON"));
        }
      };
      // start reading the file. When it is done, calls the onload event defined above.
      reader.readAsText(fileInput.files[0]);
      $("#inputImportFile")[0].value = "";
    };

    fileInput.addEventListener('change', readFile);
  }

  /*
   * Load a file
   * @param {String}               fileUrl                   The file url
   * @param {Function}             filcallbackeUrl           The function callback
   */
  loadFile(fileName, callback)
  {
    let me = this;

    let fileUrl = fileName+".json?jsoncallback=?";
    if(!fileName.startsWith("http"))
    {
      fileUrl = "files/"+fileName+".json";
    }

    $.getJSON(fileUrl, function(data) 
    {
      if(data.layers)
      {
        try
        {
          me.initParamsFromData(data);

          me.initMapFromData(data);

          callback();
        }
        catch (error) 
        {
          alert(Dictionary.get("MAP_SAVEANDLOAD_LOADFILE_INVALID"));
          console.log( "Load map fail" );

          me.layersManager.init();
          me.createEmptyMap();

          callback();
        }
      }
      else
      {
        alert(Dictionary.get("MAP_SAVEANDLOAD_LOADFILE_INVALID"));
      }
    })
    .fail(function() 
    {
      alert(Dictionary.get("MAP_SAVEANDLOAD_LOADFILE_INVALID_OR_NOTEXIST"));
      console.log( "Load map fail" );

      me.createEmptyMap();

      callback();
    });
  }

  /*
   * Create an empty map
   */
  createEmptyMap()
  {
    this.layersControl.updateLayersContent(this.layersManager);
    this.params.updateMap(this.map);
    this.backgroundControl.setBackground("openstreetmap");

    this.timeControl.updateFromParams();
  }

  /*
   * Init the map from json content
   * @param {Object}               contentObj                   The file json object
   */
  initMapFromData(contentObj)
  {
    this.layersManager.clearMap();

    this.layersManager.fromJson(contentObj);

    this.actionsControl.updateParamsFromLayerOptions(this.layersManager.selectedLayer.polygonOptions);

    if(this.params.timeEnable)
    {
      this.timeControl.setValue(this.timeControl.value);
    }
    else
    {
      this.layersManager.changeSelectZoneWithoutTime();
    }

    if(contentObj.hasOwnProperty("properties")) 
    {
      PropertiesForm.fromJson(contentObj["properties"]);
    }
  }

  /*
   * Init params from loading data and update map and background
   * @param {Object}               data                   File data
   */
  initParamsFromData(data)
  {
    this.params.fromJson(data);
    this.params.updateMap(this.map);
    this.backgroundControl.setBackground(this.params.backgroundDefault);
    this.backgroundControl.updateList(this.params.backgrounds, this.jsonBackgrounds);
    this.timeControl.updateFromParams();
  }

  /*
   * Save the file on server
   * @param {String}               name                   Name of the file
   */
  save(name)
  {
    alert("[DBG3] save() called, name='" + name + "', session=" + localStorage.getItem('session-id-histoatlas'));

    if (!localStorage.getItem('session-id-histoatlas')) {
      alert("[DBG3] Not logged in, opening login dialog");
      this.pendingSaveAfterLogin = true;
      this.loginDialog.dialog("open");
      return;
    }

    if(name.length == 0)
    {
      alert("[DBG3] Name is empty!");
      alert(Dictionary.get("MAP_SAVEANDLOAD_SAVE_FILENAME_EMPTY"));
      return;
    }

    var nameRegex = /^[a-zA-Z0-9\s]+$/;
    if(!nameRegex.test(name))
    {
      alert("[DBG3] Name invalid!");
      alert(Dictionary.get("MAP_SAVEANDLOAD_SAVE_FILENAME_INVALID"));
      return;
    }
    let fileName = name.replaceAll(" ", "_");

    let content = {};
    content = this.params.toJson(content);
    content = this.layersManager.toJson(content);
    content = PropertiesForm.toJson(content);

    // get settings from descriptionManager
    let mapLang = this.descriptionManager.lang;
    let mapType = this.descriptionManager.type;
    let isPublic = this.descriptionManager.public;

    alert("[DBG3] Calling checkIfFileExist...");
    Utils.callServer("map/checkIfFileExist", "POST", {name : name, lang : mapLang, user : localStorage.getItem('session-id-histoatlas')}).then((result) => {
      alert("[DBG3] checkIfFileExist returned, exist=" + result.exist);

      if(!result.exist || (!this.descriptionManager.pendingSave || confirm(Dictionary.get("MAP_SAVEANDLOAD_FILE_ALREADY_EXIST"))))
      {
        $("#loading").html(Dictionary.get("MAP_SAVEANDLOAD_SAVE_IN_PROGRESS"));
        this.actionsControl.buttons["save"].hide();

        let contentSave = {name : name, fileName : fileName, id : result.id, content : JSON.stringify(content), exist : result.exist, user : localStorage.getItem('session-id-histoatlas'), lang : mapLang, type : mapType, public: isPublic};
        
        Utils.callServer("map/save", "POST", contentSave).then((result) => {

          this.saveFrameControl.hide();
          this.saveFrameControl.initTimer();

          $("#loading").html("");
          this.actionsControl.buttons["save"].show();

          //toastr.success(Dictionary.get("MAP_SAVE_SUCCESS"), 'Sauvegarde');
          alert(Dictionary.get("MAP_SAVE_SUCCESS"));

          window.history.pushState("", "Title", window.location.href.split('histoAtlas.html')[0] + "histoAtlas.html?mapId=" + result.insertId);

        }).catch((err) => { alert(Dictionary.get("MAP_SAVEANDLOAD_SAVE_IMPOSSIBLE") + (err.responseJSON ? Dictionary.get(err.responseJSON.error) : err.statusText || err)); });
      }
        
    }).catch((err) => { alert(Dictionary.get("MAP_SAVEANDLOAD_SAVE_IMPOSSIBLE") + (err.responseJSON ? Dictionary.get(err.responseJSON.error) : err.statusText || err)); });
  }

  /*
   * Load a map on the server
   * @param {Number}               mapId                     The id of the map
   * @param {Function}             callback                  The callback
   */
  loadMapOnServer(mapId, callback)
  {
    let me = this;

    let apiName = `map/get/${mapId}?user=${localStorage.getItem('session-id-histoatlas')}&editMode=${me.params.editMode}&mapbox=false`
    if(!localStorage.getItem('session-id-histoatlas'))
    {
      apiName = `map/getGuest/${mapId}?editMode=${me.params.editMode}`
    }

    Utils.callServer(apiName, "GET", {}).then((result) => {

      if(result.name)
      {
        me.actionsControl.buttons["save"].setFileName(result.name);
      }

      let contentObj = JSON.parse(result.data);

      me.initParamsFromData(contentObj);

      me.initMapFromData(contentObj);

      me.descriptionManager.updateContent(result);

      document.title = `${result.name} (${result.userName}) [${result.lang}][${result.type}]`;

      callback();

    }).catch((err) => {

      if(err.status == 401) {
        localStorage.removeItem('session-id-histoatlas');
      }

      if(err.responseJSON)
      {
        alert(Dictionary.get("MAP_SAVEANDLOAD_EDIT_IMPOSSIBLE") + Dictionary.get(err.responseJSON.error));
      }

      me.layersManager.init();
      me.createEmptyMap();

      callback(); 
    });
  }

  /*
   * Check if the user is valid
   * @param {Boolean}               reinitButton                     Reinit button if is True
   * @param {Function}             callback                  The callback
   */
  checkValidUser(reinitButton, callback)
  {
    let me = this;

    if(me.params.editMode)
    {
      if(localStorage.getItem('session-id-histoatlas'))
      {
        Utils.callServer("user/checkValidUser", "GET").then((result) => {

          if(!me.logged || reinitButton)
          {
            me.actionsControl.updateLoggedState(true);
            me.logged = true;
          }

          if(callback) {
            callback(); 
          }

        }).catch((err) => {
          localStorage.removeItem('session-id-histoatlas');
          localStorage.removeItem('session-token-histoatlas');
          me.actionsControl.updateLoggedState(false);
          me.logged = false;

          if(callback) {
            callback(); 
          }
        });
      } else {
        this.loadTemporaryWork();
        me.actionsControl.updateLoggedState(false);
        me.logged = false;

        if(callback) {
          callback();
        }
      }
    } else {
      if(callback) {
        callback(); 
      }
    }
  }

  /*
   * Initialize login dialog
   */
  initLoginDialog()
  {
    let me = this;
    let width = 350;
    if($(window).width() < 480) {
      width = $(window).width() - 20;
    }
    this.loginDialog = $("#dialog-login").dialog({
      autoOpen: false,
      height: 300,
      width: width,
      modal: true,
      buttons: {
        "Login": function() {
          me.loginInEditor();
        },
        Cancel: function() {
          me.loginDialog.dialog("close");
        }
      }
    });
  }

  /*
   * Perform login within the editor
   */
  loginInEditor()
  {
    let me = this;
    let name = $("#login-username").val();
    let password = $("#login-password").val();

    alert("[DBG4] loginInEditor called, user='" + name + "'");
    Utils.callServer("user/login", "POST", {name : name, password : password}).then((response) =>
    {
      alert("[DBG4] Login succeeded, token=" + response.token.substring(0, 10) + "...");
      localStorage.setItem('session-token-histoatlas', response.token);
      localStorage.setItem('session-id-histoatlas', response.userId);

      me.loginDialog.dialog("close");
      me.checkValidUser(true, () => {
        alert("[DBG4] checkValidUser done, pendingSaveAfterLogin=" + me.pendingSaveAfterLogin);
        if (me.pendingSaveAfterLogin) {
          me.pendingSaveAfterLogin = false;
          me.save(me.descriptionManager.mapName);
        }
      });

    }).catch((err) =>
    {
      alert("[DBG4] Login FAILED: " + (err.responseJSON ? JSON.stringify(err.responseJSON) : err.statusText || err));
    });
  }

  /*
   * Save temporary work for guest
   */
  saveTemporaryWork()
  {
    let content = {};
    content = this.params.toJson(content);
    content = this.layersManager.toJson(content);
    content = PropertiesForm.toJson(content);
    localStorage.setItem('temp-map-histoatlas', JSON.stringify(content));
  }

  /*
   * Load temporary work
   */
  loadTemporaryWork()
  {
    let tempWork = localStorage.getItem('temp-map-histoatlas');
    if (tempWork) {
      let contentObj = JSON.parse(tempWork);
      this.initParamsFromData(contentObj);
      this.initMapFromData(contentObj);
      localStorage.removeItem('temp-map-histoatlas');
    }
  }
}
