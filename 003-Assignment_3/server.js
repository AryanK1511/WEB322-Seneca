/*********************************************************************************
 *  WEB322 – Assignment 02
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Aryan Khurana Student ID: 145282216 Date: 09 February 2023
 *
 *  Online (Cyclic) Link: https://zany-ox-sweatshirt.cyclic.app/about
 *
 ********************************************************************************/
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const path = require("path");
const {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostById,
  getPostsByCategory,
  getPostsByMinDate
} = require("./blog-service.js");

const app = express();

// Using the 'public' folder as our static folder
app.use(express.static("public"));

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
  res.redirect("/about");
});

// ========== About Page Route ==========
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});

// ========== Blog Page Route ==========
app.get("/blog", (req, res) => {
  getPublishedPosts()
    .then((data) => {
      res.send(data);
    })
    // Error Handling
    .catch((err) => {
      res.send(err);
    });
});

// ========== Posts Page Route ==========
app.get("/posts", (req, res) => {
  // Checking if a category was provided
  if (req.query.category) {
    getPostsByCategory(req.query.category)
    .then((data) => {
      res.send(data);
    })
    // Error Handling
    .catch((err) => {
      res.send(err);
    });
  }

  // Checking if a minimum date is provided
  else if (req.query.minDate) {
    getPostsByMinDate(req.query.minDate)
    .then((data) => {
      res.send(data);
    })
    // Error Handling
    .catch((err) => {
      res.send(err);
    });
  }

  // Checking whether no specification queries were provided
  else {
    getAllPosts()
    .then((data) => {
      res.send(data);
    })
    // Error Handling
    .catch((err) => {
      res.send(err);
    });
  }
});

// ========== Add Post Page Route (GET) ==========
app.get("/posts/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "addPost.html"));
})

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
    postObject.postDate = Date.now();
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
})

// ========== Categories Page Route ==========
app.get("/categories", (req, res) => {
  getCategories()
    .then((data) => {
      res.send(data);
    })
    // Error Handling
    .catch((err) => {
      res.send(err);
    });
});

// ========== HANDLE 404 REQUESTS ==========
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "notFoundPage.html"));
});

// ========== Setup http server to listen on HTTP_PORT ==========
initialize().then(() => {
  // Start the server after the files are read and the initialization is done
  app.listen(HTTP_PORT, () => {
    console.log("Express http server listening on: " + HTTP_PORT);
  });
});
