/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require("ui");
var Vector2 = require("vector2");
var ajax = require("ajax");
var Settings = require("settings");

var main = new UI.Card({
  title: "Signal K",
  body: "Press any button.",
  subtitleColor: "indigo", // Named colors
  bodyColor: "#9a0036" // Hex colors
});

main.show();

var skItems = [];
var skTree = {};
var favorites;
if (!Settings.data("favorites")) {
  Settings.data("favorites", [
    {
      path: "navigation.speedThroughWater",
      value: 3.07,
      sourceRef: "n2kFromFile.115"
    },
    {
      path: "navigation.speedOverGround",
      value: 2.95,
      sourceRef: "n2kFromFile.160"
    },
    {
      path: "electrical.batteries.1.voltage",
      value: 14.55,
      sourceRef: "n2kFromFile.129"
    }
  ]);
}

var host = "192.168.1.103";
var port = 3000;
var url =
  "http://" + host + (port ? ":" + port : "") + "/signalk/v1/api/self/values/";

function toTree(items) {
  var tree = {};
  items.map(function(item) {
    var currentNode = tree;
    item.path.split(".").forEach(function(pathPart, index, array) {
      if (index < array.length - 1) {
        if (!currentNode[pathPart]) {
          currentNode[pathPart] = {
            values: []
          };
        }
        currentNode = currentNode[pathPart];
      }
    });
    currentNode.values.push(item);
  });
  return tree;
}

function getLastPathPart(path) {
  var parts = path.split(".");
  return parts[parts.length - 1];
}

function getSkMenuItems(tree, depth) {
  var result = [];
  for (var property in tree) {
    if (property !== "values") {
      result.push({
        title: property
      });
    }
  }
  tree.values &&
    tree.values.forEach(function(item) {
      result.push({
        title: item.value,
        subtitle: getLastPathPart(item.path)
      });
    });
  return result;
}

function getItem(data, index) {
  var branches = [];
  if (typeof data === "object") {
    branches = Object.getOwnPropertyNames(data).filter(function(item) {
      return item != "values";
    });
  }
  if (index < branches.length) {
    return data[branches[index]];
  }
  return data.values[index - branches.length];
}

function isLeaf(node, itemIndex) {
  var propsCount = Object.getOwnPropertyNames(node).filter(function(item) {
    return item != "values";
  }).length;
  return itemIndex >= propsCount;
}

function showMenu(tree, depth) {
  var menu = new UI.Menu({
    sections: [
      {
        items: getSkMenuItems(tree, depth)
      }
    ]
  });
  menu.on("select", function(e) {
    console.log(
      "Selected item #" + e.itemIndex + " of section #" + e.sectionIndex
    );
    console.log('The item is titled "' + e.item.title + '"');
    var item = getItem(tree, e.itemIndex);
    if (isLeaf(tree, e.itemIndex)) {
      var favorites = Settings.data("favorites").filter(function(favorite) {
        return (
          favorite.path != item.path || favorite.sourceRef != item.sourceRef
        );
      });
      favorites.push(item);
      Settings.data("favorites", favorites);
      console.log(JSON.stringify(favorites, null, 2));
    } else {
      showMenu(item, depth + 1);
    }
  });
  menu.show();
}

main.on("click", "up", function(e) {
  ajax(
    {
      url: url,
      type: "json"
    },
    function(data) {
      skItems = data;
      skTree = toTree(data);
      showMenu(skTree, 0);
    }
  );
});

main.on("click", "select", function(e) {
  favorites = Settings.data("favorites");
  showData(0);
});

function showData(incomingFavorite) {
  var currentFavorite = incomingFavorite;
  if (currentFavorite < 0) {
    currentFavorite = 0;
  }
  if (currentFavorite >= favorites.length && favorites.length > 0) {
    currentFavorite = favorites.length - 1;
  }
  var wind = new UI.Window({
    backgroundColor: "white"
  });
  var radial = new UI.Radial({
    size: new Vector2(140, 140),
    angle: 0,
    angle2: 360,
    radius: 20,
    backgroundColor: "cyan",
    borderColor: "celeste",
    borderWidth: 1
  });
  var textfield = new UI.Text({
    size: new Vector2(140, 60),
    color: "black",
    font: "bitham-42-bold",
    text:
      favorites.length > currentFavorite
        ? favorites[currentFavorite].value
        : "N/A",
    textAlign: "center"
  });

  var legendText = new UI.Text({
    size: new Vector2(140, 60),
    color: "black",
    font: "gothic-14-bold",
    text:
      favorites.length > currentFavorite
        ? favorites[currentFavorite].path
        : "N/A",
    textAlign: "center"
  });

  var windSize = wind.size();
  // Center the radial in the window
  var radialPos = radial
    .position()
    .addSelf(windSize)
    .subSelf(radial.size())
    .multiplyScalar(0.5);
  radial.position(radialPos);
  // Center the textfield in the window
  var textfieldPos = textfield
    .position()
    .addSelf(windSize)
    .subSelf(textfield.size())
    .multiplyScalar(0.5);
  textfield.position(textfieldPos);

  var legendTextPosition = legendText.position();
  // .addSelf(windSize)
  // .subSelf(legendText.size())
  // .multiplyScalar(0.6);
  legendText.position(legendTextPosition);

  // wind.add(radial);
  wind.add(textfield);
  wind.add(legendText);

  wind.show();

  wind.on("click", "down", function() {
    updateData(currentFavorite + 1, showData(currentFavorite + 1));
    wind.hide();
  });
  wind.on("click", "up", function() {
    updateData(currentFavorite - 1, showData(currentFavorite - 1));
    wind.hide();
  });

  wind.on("click", "select", function() {
    updateData(currentFavorite, wind);
  });

  wind.on("longClick", "select", function() {
    favorites.splice(currentFavorite, 1);
    Settings.data("favorites", favorites);
    showData(currentFavorite);
    wind.hide();
  });

  return wind;
}

function updateData(favoriteIndex, wind) {
  if (favorites.length > favoriteIndex && favoriteIndex >= 0) {
    ajax(
      {
        url:
          url +
          favorites[favoriteIndex].path +
          "/" +
          favorites[favoriteIndex].sourceRef,
        type: "json"
      },
      function(data) {
        favorites[favoriteIndex] = data;
        showData(favoriteIndex);
        wind.hide();
      }
    );
  }
}

main.on("click", "down", function(e) {
  var card = new UI.Card();
  card.title("A Card");
  card.subtitle("Is a Window");
  card.body("The simplest window type in Pebble.js.");
  card.show();
});
