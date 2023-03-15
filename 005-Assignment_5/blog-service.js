const Sequelize = require("sequelize");
const { gte } = Sequelize.Op;

// set up sequelize to point to our postgres database
var sequelize = new Sequelize(
  "tgxufbkt",
  "tgxufbkt",
  "Jcv_k8x_AoNEzn36l-r6Q24T7Oy1nIud",
  {
    host: "babar.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

// Defining the Post Model
const Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

// Defining the Category Model
const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

// This will ensure that our Post model gets a "category" column that will act as a foreign key to the Category model
Post.belongsTo(Category, { foreignKey: "category" });

// => Read the posts.json and categories.json files and store the data in global arrays
function initialize() {
  // Ensures that the categories file is read and assigned first before usage
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject("Unable to sync to the database.");
      });
  });
}

// => Provides full array of "posts" objects
function getAllPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

// => Provides an array of "post" objects whose published property is true
function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

// => Provides an array of "post" objects whose published property is true and finds posts by category
function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        category: category,
        published: true,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

// => Provides full array of "category" objects
function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

// => Finds a post using its ID
function getPostById(id) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        id: id,
      },
    })
      .then((data) => {
        resolve(data[0]);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

// => Find posts by category
function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        category: category,
      },
    })
      .then((data) => {
        console.log(category);
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

// => Find posts that have a date greater than the specified minimum date
function getPostsByMinDate(minDate) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr),
        },
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

// => Adds a new post
function addPost(postData) {
  return new Promise((resolve, reject) => {
    // Ensure published property is set correctly
    postData.published = postData.published ? true : false;

    // Making sure that the empty values are null
    for (const i in postData) {
      if (postData[i] === "") {
        postData[i] = null;
      }
    }

    // Setting the date
    postData.postDate = new Date();

    // Create a new Post using the postData
    Post.create(postData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Unable to create post");
      });
  });
}

// => Adds a new category
function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    for (let i in categoryData) {
      if (categoryData[i] === "") {
        categoryData[i] = null;
      }
    }

    Category.create(categoryData)
      .then((category) => {
        resolve(category);
      })
      .catch(() => {
        reject("unable to create category");
      });
  });
}

// => Deletes a category by id
function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        resolve("Destroyed");
      })
      .catch(() => {
        reject("Unable to delete category");
      });
  });
}

// => Deletes a post by id
function deletePostById(id) {
  return new Promise((resolve, reject) => {
    Post.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        resolve("Destroyed");
      })
      .catch(() => {
        reject("Unable to delete post");
      });
  });
}

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostById,
  getPostsByCategory,
  getPostsByMinDate,
  getPublishedPostsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
};
