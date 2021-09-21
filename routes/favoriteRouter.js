const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate");
const cors = require("./cors");

const Favorites = require("../models/favorite");

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Favorites.find({})
      .populate("user")
      .populate("dishes")
      .then(
        (favorite) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })

  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite == null) {
        Favorites.create({
          user: req.user._id,
          dishes: req.body,
        })
          .then(
            (favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      } else {
        for (var i = 0; i < req.body.length; i++) {
          if (favorite.dishes.indexOf(req.body[i]._id) == -1) {
            favorite.dishes.push(req.body[i]);
          } else {
            continue;
          }
        }
        favorite
          .save()
          .then(
            (favorite) => {
              Favorites.findById(favorite._id)
                .populate("user")
                .populate("dishes")
                .then((favorite) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(favorite);
                });
            },
            (err) => next(err)
          )
          .catch((err) => {
            return next(err);
          });
      }
    });
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndDelete({ user: req.user._id })
      .then(
        (resp) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })

  .get(cors.cors, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(
        (favorites) => {
          if (!favorites) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.json({ exists: false, favorites: favorites });
          } else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: false, favorites: favorites });
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: true, favorites: favorites });
            }
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })

  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite == null) {
        Favorites.create({
          user: req.user._id,
          dishes: req.params.dishId,
        })
          .then(
            (favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            },

            (err) => next(err)
          )
          .catch((err) => next(err));
      } else if (favorite != null) {
        if (favorite.dishes.indexOf(req.params.dishId) == -1) {
          favorite.dishes.push(req.params.dishId);
          favorite.save().then(
            (favorite) => {
              Favorites.findById(favorite._id)
                .populate("user")
                .populate("dishes")
                .then((favorite) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(favorite);
                });
            },
            (err) => next(err)
          );
        } else {
          err = new Error("Dish already exists");
          err.status = 404;
          return next(err);
        }
      }
    });
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(
        (favorite) => {
          if (favorite != null) {
            if (favorite.dishes.indexOf(req.params.dishId) == -1) {
              err = new Error("This dish not found");
              err.status = 404;
              return next(err);
            } else {
              favorite.dishes.pull(req.params.dishId);
              favorite.save().then(
                Favorites.findById(favorite._id)
                  .populate("user")
                  .populate("dishes")
                  .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                  }),
                (err) => next(err)
              );
            }
          } else {
            err = new Error("No favorite document for you! ");
            err.status = 404;
            return next(err);
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
