function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");

  this.score = 0;
}

/************************************************************************
Wikipedia utility function(s)
/***********************************************************************/
//function fetchRandom(response) {
//    response = (response === undefined) ? "" : response;
//    if(response != "")
//    {
//        var randvals = {};
//        randvals['url'] = '';
//        randvals['img'] = '';
//        alert(response);
//        return;
//    }
//    var request = "http://en.wikipedia.org/w/api.php?action=query&format=xml&generator=random&prop=images|info&imlimit=1&grnnamespace=0&inprop=url";
//    var randvals = {};
//    randvals['url'] = '';
//    randvals['img'] = '';
//    var xmlreq = new XMLHttpRequest;
//    xmlreq.onreadystatechange=function()
//    {
//        if (xmlreq.readyState==4 && xmlreq.status==200)
//        {
//            alert("response");
//            alert(xmlreq.responseText);
//            fetchRandom(xmlreq.responseText);
//        }
//    }
//
//    xmlreq.open("GET",request,true);
//    xmlreq.send();
//
//    /*while(randvals.img == ''){
//        xmlreq.open("GET",request,true);
//        xmlreq.send();
//        alert(xmlreq.responseText);
//    }*/
//}

var WikipediaCORS=
    {
    setMessage:function(msg)
        {
            alert(msg);
        },
    // Create the XHR object.
    createCORSRequest:function(url)
        {
        var xhr = new XMLHttpRequest();


        if ("withCredentials" in xhr)
            {
            xhr.open("GET", url, true);
            }
        else if (typeof XDomainRequest != "undefined")
            {
            xhr = new XDomainRequest();
            xhr.open(method, url);
            }
        else
            {
            return null;
            }
          xhr.setRequestHeader("Origin", "http://delve.github.io");
          xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
//        xhr.setRequestHeader("Access-Control-Allow-Credentials", "true");
//        xhr.setRequestHeader("Access-Control-Allow-Origin","*");
        return xhr;
        },
    init:function()
        {
        var _this=this;
//var request = "http://en.wikipedia.org/w/api.php?action=query&format=xml&generator=random&prop=images|info&imlimit=1&grnnamespace=0&inprop=url";
        var url = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=Javascript&format=json';
        var xhr = this.createCORSRequest(url);
        if (!xhr)
            {
                this.setMessage('CORS not supported');
                return;
            }

        xhr.onload = function()
            {
                _this.setMessage(xhr.responseText);
            };
        xhr.onerror = function()
            {
                _this.setMessage('Woops, there was an error making the request.');
            };
        xhr.send();
        }
    };
/************************************************************************
END Wikipedia utility function(s)
************************************************************************/


HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);
  var tileIMG = document.createElement("img");
  var tileURL = document.createElement("a");
//  var randomWiki = fetchRandom();
  var randomWiki = WikipediaCORS.create();

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");

	tileIMG.src = "style/1.JPG";
  tileIMG.classList.add("tile-img");
  tileURL.href="google.com";

  inner.appendChild(tileURL);
  tileURL.appendChild(tileIMG);

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};
