/* Read JSON-File from Server */
let importedRecipes;
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    importedRecipes = JSON.parse(this.responseText);
  }
};

xmlhttp.open(
  "GET",
  "https://raw.githack.com/samgotswag/recipes1/main/recipes.json",
  false
);

xmlhttp.send();

// Use the hereby added recipe.selected Property to select/unselect recipes in the GUI 
// and to define the shopping list.
importedRecipes.forEach(function(recipe, index) {
  recipe.selected = false;
});

function getRecipeCollection() {
  recipes = [];
  // We want to randomize the recipces, 
  // so that each time we look at it other recipes catch our attention 
  // therefore hopefully creating diversity in our nutrition.
  importedRecipes.sort(function() {
    return 0.5 - Math.random();
  });
  
  uniquePriorities = getUniquePriorities();
  uniquePriorities.forEach(priority => {
    recipes.push(importedRecipes.filter(function(recipe) {
      return recipe.priority == priority;
    }));
  });
  // Flatten array
  recipes = [].concat(...recipes);

  return recipes;
}

function getUniquePriorities() {
  priorities = importedRecipes.map(function(recipe) {
    return parseInt(recipe.priority);
  })
  uniquePriorities = [...new Set(priorities)];
  return uniquePriorities.sort();
}

// Random order of recipes
const recipeCollection = getRecipeCollection();
/* --------------------------- */

function filterSelectedAndAggregateAmounts(recipes) {
  const ingredients = {};

  counter = 1;
  filteredRecipes = recipes.filter(recipe => recipe.selected == true)
  filteredRecipes.forEach(receipe => {
    receipe.ingredients.forEach(ing => {
      if (!ingredients[ing.name]) {
        ingredients[ing.name] = {
          unit: ing.unit,
          amount: ing.amount,
          department: ing.department
        };
      } else {
        ingredients[ing.name].amount = ingredients[ing.name].amount + ing.amount;
      }
    });
  });

  return ingredients;
}

/* --------- VUE component------------*/
Vue.component("my-meal", {
  props: ["recipe", "recipes", "index"],
  methods: {
    toggleSelectedRecipe: function() {
      this.recipes[this.index].selected = !this.recipes[this.index].selected;
    }
  },
  template:
    '<a href="javascript:void(0);" class="list-group-item list-group-item-action" v-bind:class="{active: recipes[index].selected}" v-on:click="toggleSelectedRecipe"> {{ recipe.recipeName }}</a>'
});

/* ---------- VUE instance ------------*/
var vm = new Vue({
  el: "#app",
  data: {
    recipes: recipeCollection
  },
  methods: {
    onCopy: function(e) {
      alert("Folgende Liste ist in die Zwischenablage kopiert:\n\n" + e.text);
    },
    onError: function(e) {
      alert("Fehler beim Kopieren in die Zwischenablage.");
    }
  },
  computed: {
    shoppingList: function() {
      let recipes = this.recipes;
      const ingredients = filterSelectedAndAggregateAmounts(recipes);
      const lst = Object.keys(ingredients).map(name => ({
        name: name,
        unit: ingredients[name].unit,
        amount: ingredients[name].amount,
        department: ingredients[name].department
      }));
      lst.sort(
        (l, r) => (l.name <= r.name ? -1 : 1)
      );
      const sortedByDepartment = lst.sort(
        (l, r) => (l.department <= r.department ? 1 : -1)
      );

      return sortedByDepartment.map(
        ing => `${ing.amount} ${ing.unit} ${ing.name}`
      );
    },
    clipboardShoppingList: function() {
      date = new Date();
      return (
        "Einkaufsliste für den " +
        date.toLocaleDateString("de-DE", {
          weekday: "short",
          year: "numeric",
          month: "long",
          day: "numeric"
        }) +
        ":\n" +
        this.shoppingList.join("\n")
      );
    },
    clipboardMenues: function() {
      let selectedRecipesSorted = this.selectedRecipes
      .sort( (l, r) => (l.recipeName >= r.recipeName ? 1 : -1) )
      .sort( (l, r) => (l.priority >= r.priority ? 1 : -1) )
      date = new Date();
      let output =
        "Menüliste ab dem " +
        date.toLocaleDateString("de-DE", {
          weekday: "short",
          year: "numeric",
          month: "long",
          day: "numeric"
        }) +
        ":\n" +
        selectedRecipesSorted
          .map(recipe => recipe.recipeName)
          .join(", ")
          .toUpperCase() +
        "\n\n";
      for (var i = 0; i < selectedRecipesSorted.length; i++) {
        output +=
          selectedRecipesSorted[i].recipeName.toUpperCase() +
          "\n" +
          "--------------------" +
          "\n";
        for (var j = 0; j < selectedRecipesSorted[i].ingredients.length; j++) {
          output += 
            selectedRecipesSorted[i].ingredients[j].amount + " " +
            selectedRecipesSorted[i].ingredients[j].unit +
            " " +
            selectedRecipesSorted[i].ingredients[j].name +
            "\n";
        }
        output += '\n"' + selectedRecipesSorted[i].comment + ' Priorität ' + selectedRecipesSorted[i].priority + '"' + "\n\n\n";
      }
      return output;
    },
    selectedRecipes: function() {
      return this.recipes.filter(recipe => recipe.selected == true);
    }
  }
});
