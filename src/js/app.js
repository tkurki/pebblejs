/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require("ui");
var Vector2 = require("vector2");
var ajax = require("ajax");

var main = new UI.Card({
  title: "Signal K",
  body: "Press any button.",
  subtitleColor: "indigo", // Named colors
  bodyColor: "#9a0036" // Hex colors
});

main.show();

var skItems = [];
var skTree = {};
var favorites = [];

ajax(
  {
    url: "http://192.168.1.103:3000/signalk/v1/api/self/values/",
    type: "json"
  },
  function(data) {
    skItems = data;
    skTree = toTree(data);
    console.log(data);
  }
);

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
      favorites = favorites.filter(function(favorite) {
        return (
          favorite.path != item.path || favorite.sourceRef != item.sourceRef
        );
      });
      favorites.push(item);
      console.log(JSON.stringify(favorites, null, 2));
    } else {
      showMenu(item, depth + 1);
    }
  });
  menu.show();
}

main.on("click", "up", function(e) {
  showMenu(skTree, 0);
});

main.on("click", "select", function(e) {
  var wind = new UI.Window({
    backgroundColor: "black"
  });
  var radial = new UI.Radial({
    size: new Vector2(140, 140),
    angle: 0,
    angle2: 300,
    radius: 20,
    backgroundColor: "cyan",
    borderColor: "celeste",
    borderWidth: 1
  });
  var textfield = new UI.Text({
    size: new Vector2(140, 60),
    font: "gothic-24-bold",
    text: "Dynamic\nWindow",
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
  wind.add(radial);
  wind.add(textfield);
  wind.show();
});

main.on("click", "down", function(e) {
  var card = new UI.Card();
  card.title("A Card");
  card.subtitle("Is a Window");
  card.body("The simplest window type in Pebble.js.");
  card.show();
});
