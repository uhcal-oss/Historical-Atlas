
class ActionButtonSave extends ActionButton
{
  /*
   * Button of manage load file
   * @property {L.Dom}             _menu                 The menu div of choose file
   * @param {L.Dom}                container             The contener element
   * @param {String}               imgSrc                The image src
   * @param {String}               title                 The button title
   * @param {PaintLayer}           paintParams           The paint parameters
   * @param {LoadSaveManager}      loadSaveManager       Load and Save Manager
   */
  constructor(container, imgSrc, title, paintParams, loadSaveManager)
  {
    super(container, "img/actions/save-regular.svg", title, null, 'a', 'action-button');

    this.importInit = false;

    L.DomEvent.on(this.buttonDom, 'click', function(e) {
      paintParams.uiClick = true;
      if (loadSaveManager.descriptionManager.mapName) {
        loadSaveManager.save(loadSaveManager.descriptionManager.mapName);
      } else {
        loadSaveManager.descriptionManager.pendingSave = true;
        loadSaveManager.descriptionManager.display();
      }
    }, this);

    this.visibleState = false;
  }

  /*
   * Set the name of the save file
   * @param {String}               name                The name
   */
  setFileName(name)
  {
    // Deprecated, name is managed by descriptionManager
  }

  /*
   * Change the display state
   * @param {Boolean}               display                The display state
   */
  changeDisplay(display)
  {
    if(display)
    {
      this.buttonDom.style["display"] = "inline-block";
      this.visibleState = true;
    }
    else
    {
      this.buttonDom.style["display"] = "none";
      this.visibleState = false;
    }
  }

  /*
   * Hide the button
   */
  hide()
  {
    super.hide();
  }

  /*
   * Show the button
   */
  show()
  {
    if(this.visibleState)
    {
      super.show();
    }
  }
}
