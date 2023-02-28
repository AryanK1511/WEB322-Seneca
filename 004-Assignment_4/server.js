/*********************************************************************************
 *  WEB322 – Assignment 02
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Aryan Khurana Student ID: 145282216 Date: 28 February 2023
 *
 *  Online (Cyclic) Link: https://zany-ox-sweatshirt.cyclic.app/about
 *
 ********************************************************************************/
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const path = require("path");
const stripJs = require("strip-js");
const blogData = require("./blog-service.js");
const {
  initialize,
  getAllPosts,
  getCategories,
  addPost,
  getPostById,
  getPostsByCategory,
  getPostsByMinDate,
} = require("./blog-service.js");

const app = express();

// Using the 'public' folder as our static folder
app.use(express.static("public"));

// This will add the property "activeRoute" to "app.locals" whenever the route changes
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Register handlebars as the rendering engine for views
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    // Handlebars custom helper to create active navigation links
    // Usage: {{#navLink "/about"}}About{{/navLink}}
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      // Handlebars custom helper to check for equality
      // Usage: {{#equal value1 value2}}...{{/equal}}
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set("view engine", ".hbs");

// Configuring Cloudinary
cloudinary.config({
  cloud_name: "dtjzbh27c",
  api_key: "352185835558593",
  api_secret: "XWtpK6nUkH_eDPJIwyaGDNvo1F0",
  secure: true,
});

// Variable without any disk storage
const upload = multer();

// Configuring the port
const HTTP_PORT = process.env.PORT || 8080;

// ========== Home Page Route ==========
app.get("/", (req, res) => {
  res.redirect("/blog");
});

// ========== About Page Route ==========
app.get("/about", (req, res) => {
  res.render("about");
});

// ========== Blog Page Route ==========
app.get("/blog", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};
  try {
    // declare empty array to hold "post" objects
    let posts = [];
    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }
    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    // get the latest post from the front of the list (element 0)
    let post = posts[0];
    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

// ========== Posts Page Route ==========
app.get("/posts", (req, res) => {
  // Checking if a category was provided
  if (req.query.category) {
    getPostsByCategory(req.query.category)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      // Error Handling
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }

  // Checking if a minimum date is provided
  else if (req.query.minDate) {
    getPostsByMinDate(req.query.minDate)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      // Error Handling
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }

  // Checking whether no specification queries were provided
  else {
    getAllPosts()
      .then((data) => {
        res.render("posts", { posts: data });
      })
      // Error Handling
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }
});

// ========== Add Post Page Route (GET) ==========
app.get("/posts/add", (req, res) => {
  res.render("addPost");
});

// ========== Add Post Page Route (POST) ==========
app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  // Configuring cloudinary image uploading
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);
    return result;
  }

  // Once the upload is completed, we store the other form data in the object
  upload(req)
    .then((uploaded) => {
      req.body.featureImage = uploaded.url;
      let postObject = {};

      // Add it Blog Post before redirecting to /posts
      postObject.body = req.body.body;
      postObject.title = req.body.title;
      postObject.postDate = new Date().toISOString().slice(0, 10);
      postObject.category = req.body.category;
      postObject.featureImage = req.body.featureImage;
      postObject.published = req.body.published;

      // Adding the post if everything is okay
      // Only add the post if the entries make sense
      if (postObject.title) {
        addPost(postObject);
      }
      res.redirect("/posts");
    })
    // Error Handling
    .catch((err) => {
      res.send(err);
    });
});

// ========== Find a post by ID Route ==========
app.get("/post/:value", (req, res) => {
  getPostById(req.params.value)
    .then((data) => {
      res.send(data);
    })
    // Error Handling
    .catch((err) => {
      res.send(err);
    });
});

// ========== Categories Page Route ==========
app.get("/categories", (req, res) => {
  getCategories()
    .then((data) => {
      res.render("categories", { categories: data });
    })
    // Error Handling
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});

// ========== Blog By ID Page Route ==========
app.get('/blog/:id', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};
  try{
      // declare empty array to hold "post" objects
      let posts = [];
      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogData.getPublishedPosts();
      }
      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
  }catch(err){
      viewData.message = "no results";
  }
  try{
      // Obtain the post by "id"
      viewData.post = await blogData.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }
  try{
      // Obtain the full list of "categories"
      let categories = await blogData.getCategories();
      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }
  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});

// ========== HANDLE 404 REQUESTS ==========
app.use((req, res) => {
  res.status(404).render("404");
});

// ========== Setup http server to listen on HTTP_PORT ==========
initialize().then(() => {
  // Start the server after the files are read and the initialization is done
  app.listen(HTTP_PORT, () => {
    console.log("Express http server listening on: " + HTTP_PORT);
  });
});
