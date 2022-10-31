const { default: mongoose } = require("mongoose");
const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const async = require("async");

const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find({})
    .populate("book")
    .exec(function (err, book_instances) {
      if (err) return next(err);
      res.render("bookinstance_list", {
        title: "Book Instance List",
        book_instances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  const id = mongoose.Types.ObjectId(req.params.id);
  BookInstance.findById(id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) return next(err);
      res.render("bookinstance_detail", {
        title: bookinstance.id,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) return next(err);
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status", "Status must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      console.log(errors);
      Book.find({}, "title").exec((err, books) => {
        if (err) return next(err);
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          books,
          selected_book: bookinstance.book._id,
          bookinstance,
          errors: errors.array(),
        });
      });
    } else {
      bookinstance.save((err) => {
        if (err) return next(err);
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, result) => {
      if (err) return next(err);
      if (result == null) {
        res.redirect("/catalogs/bookinstances");
      }
      res.render("bookinstance_delete", {
        title: "Delete Bookinstance",
        bookinstance: result,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndDelete(req.body.bookinstanceid, (err) => {
    if (err) return next(err);
    res.redirect("/catalog/bookinstances");
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      books(callback) {
        Book.find(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);
      if (results.bookinstance == null) {
        const err = new Error("Book instance not Found");
        err.status(404);
        next(err);
      }
      res.render("bookinstance_form", {
        title: "Update Book instance",
        bookinstance: results.bookinstance,
        selected_book: results.bookinstance.book._id,
        books: results.books,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status", "Status must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) return next(err);
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          books,
          selected_book: bookinstances.book._id,
          bookinstance,
          errors: errors.array(),
        });
      });
    } else {
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        (err, thebookinstance) => {
          if (err) next(err);
          res.redirect(thebookinstance.url);
        }
      );
    }
  },
];
