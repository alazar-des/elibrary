const { default: mongoose } = require("mongoose");
const Genre = require("../models/genre");
const Book = require("../models/book");

const async = require("async");

const { body, validationResult } = require("express-validator");

const { find } = require("../models/genre");

// Display list of all Genre.
exports.genre_list = (req, res) => {
  Genre.find({})
    .sort({ name: 1 })
    .exec((err, genres) => {
      res.render("genre_list", {
        title: "Genre List",
        genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  const id = mongoose.Types.ObjectId(req.params.id);
  async.parallel(
    {
      genre(callback) {
        Genre.findById(id).exec(callback);
      },
      books(callback) {
        Book.find({ genre: id }).exec(callback);
      },
    },
    (err, result) => {
      if (err) return next(err);
      if (result.genre === null) {
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: result.genre,
        genre_books: result.books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  //validate and sanitize the name field
  body("name", "Genre name is required.").trim().isLength({ min: 1 }).escape(),

  //process req after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      Genre.findOne({ name: req.body.name }).exec((err, genre_found) => {
        if (err) return next(err);
        if (genre_found) {
          res.redirect(genre_found.url);
        } else {
          genre.save((err) => {
            if (err) return next(err);
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id, callback);
      },
      genre_books(callback) {
        Book.find({ genre: req.params.id }, callback);
      },
    },
    (err, results) => {
      if (err) return next(err);
      if (results.genre == null) {
        res.redirect("/catalg/genres");
      }
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.genreid, callback);
      },
      genre_books(callback) {
        Book.find({ genre: req.body.genreid }, callback);
      },
    },
    (err, results) => {
      if (err) return next(err);
      if (results.genre_books > 0) {
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      } else {
        Genre.findByIdAndDelete(req.body.genreid, (err) => {
          if (err) return next(err);
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
  Genre.findById(req.params.id, (err, thegenre) => {
    if (err) return next(err);
    res.render("genre_form", {
      title: "Update Genre",
      genre: thegenre,
    });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre name is required").trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Update Genre",
        genre,
        errors: errors.array(),
      });
      return;
    }
    Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
      if (err) return next(err);
      res.redirect(thegenre.url);
    });
  },
];
