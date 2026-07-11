class Utils 
{
  /*
   * Call an API in the server
   * @param {String}               apiName                   The api name
   * @param {String}               method                    The method (GET, POST, ...)
   * @param {Object}               data                      Data of the API
   */
  static callServer(apiName, method, data)
  {
    return new Promise(function(resolve, reject) 
    {
      Config.load().then((config) =>
      {
        let urlServer = config.serverUrl + "/api/" + apiName;
        console.log("[DBG-UTILS] callServer:", method, urlServer);

        if(data)
        {
          $.ajax({
            crossDomain: true,
            url: urlServer,
            method: method,
            contentType: "application/json",
            headers:{ 'Authorization': localStorage.getItem('session-token-histoatlas') },
            data: JSON.stringify(data),
            success: (response) => {
              console.log("[DBG-UTILS] SUCCESS:", urlServer);
              resolve(response);
            },
            error: (err) => {
              console.log("[DBG-UTILS] ERROR:", urlServer, err.status, err.statusText);
              reject(err);
            }
          });
        }
        else
        {
          $.ajax({
            crossDomain: true,
            url: urlServer,
            method: method,
            contentType: "application/json",
            headers:{ 'Authorization': localStorage.getItem('session-token-histoatlas') },
            success: (response) => {
              console.log("[DBG-UTILS] SUCCESS:", urlServer);
              resolve(response);
            },
            error: (err) => {
              console.log("[DBG-UTILS] ERROR:", urlServer, err.status, err.statusText);
              reject(err);
            }
          });
        }
      }).catch((err) => {
        console.log("[DBG-UTILS] Config.load() FAILED:", err);
      });
    });
  }
}