const mongoose = require("mongoose");
const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const async = require("async");
const { render } = require("pug");
const { populate } = require("../models/genre");

const { body, validationResult } = require("express-validator");
const book = require("../models/book");

exports.index = (req, res) => {
  async.parallel(
    {
      book_count(callback) {
        Book.countDocuments({}, callback);
      },
      book_instance_count(callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count(callback) {
        BookInstance.countDocuments({ status: "Available" }, callback);
      },
      author_count(callback) {
        Author.countDocuments({}, callback);
      },
      genre_count(callback) {
        Genre.countDocuments({}, callback);
      },
    },
    (err, results) => {
      res.render("index", {
        title: "Local Library Home",
        err: err,
        data: results,
      });
    }
  );
};

// Display list of all books.
exports.book_list = (req, res, next) => {
  Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec(function (err, book_list) {
      if (err) return next(err);
      res.render("book_list", {
        title: "Book List",
        book_list: book_list,
      });
    });
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  const id = mongoose.Types.ObjectId(req.params.id);
  async.parallel(
    {
      book(callback) {
        Book.findById(id).populate("author").populate("genre").exec(callback);
      },
      bookinstance(callback) {
        BookInstance.find({ book: id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);
      if (results === null) {
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      res.render("book_detail", {
        title: results.book.title,
        book: results.book,
        bookinstances: results.bookinstance,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel(
    {
      authors(callback) {
        Author.find(callback);
      },
      genres(callback) {
        Genre.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors(callback) {
            Author.find(callback);
          },
          genres(callback) {
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err) return next(err);
          for (const genre of results.genres) {
            if (book.genre.includes(genre._id)) {
              genre.checked = true;
            }
          }
          res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
            book,
            errors: errors.array(),
          });
        }
      );
    }
    book.save((err) => {
      if (err) return next(err);
      res.redirect(book.url);
    });
  },
];

// Display book delete form on GET.
exports.book_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Book delete GET");
};

// Handle book delete on POST.
exports.book_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Book delete POST");
};

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      authors(callback) {
        Author.find().exec(callback);
      },
      genres(callback) {
        Genre.find().exec(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);
      if (results.book == null) {
        const err = new Error("Book not found.");
        err.status = 404;
        return next(err);
      }
      for (const genre of results.genres) {
        for (const book_genre of results.book.genre) {
          if (genre._id.toString() === book_genre._id.toString()) {
            genre.checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update Book",
        book: results.book,
        genres: results.genres,
        authors: results.authors,
      });
    }
  );
};

// Handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },
  body("title", "Title must not be empty").trim().isLength({ min: 1 }).escape(),
  body("author", "Author must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summery: req.body.summery,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors(callback) {
            Author.find(callback);
          },
          genres(callback) {
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err) return next(err);

          for (const genre of results.genres) {
            if (book.genre.includes(genre)) {
              genre.checked = "true";
            }
          }

          res.render("book_form", {
            title: "Update Book",
            book,
            authors: results.authors,
            genres: results.genres,
            errors: errors.array(),
          });
        }
      );
    } else {
      Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
        if (err) return next(err);
        res.redirect(thebook.url);
      });
    }
  },
];
