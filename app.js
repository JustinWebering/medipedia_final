// Importieren von Code-Bibliotheken
const express = require("express");
const mustacheExpress = require("mustache-express");
const Pool = require("pg").Pool;
const app = express();
const sessions = require("express-session");
const port = process.env.PORT || 3010;
const bcrypt = require("bcrypt");
var cookieParser = require("cookie-parser");

// Konfiguration und Einstellungen
app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");
app.use(cookieParser());

const pool = new Pool({
  user: "postgres",
  host: "168.119.168.41",
  database: "medipedia",
  password: "cff5bbc6e9851d8d8d05df294755b844",
  port: 5432
});

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

// Routen

//zum einloggen, Cookie bei Benutzer setzen,
// und Passwort mit Passwort in Datenbank abgleichen
app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: 86400000, secure: false },
    resave: false
  })
);

//Zum einloggen (Formular):
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", function (req, res) {
  pool.query(
    "SELECT * FROM users WHERE email = $1",
    [req.body.email],
    (error, result) => {
      if (error) {
        throw error;
      }
      if (bcrypt.compareSync(req.body.password, result.rows[0].password)) {
        req.session.benutzerid = result.rows[0].id;
        res.redirect("/");
      } else {
        res.redirect("/login");
      }
    }
  );
});

//Startseite ausgeben:
app.get("/", (req, res) => {
  if (!req.session.benutzerid) {
    res.redirect("/login");
    return;
  }
  pool.query("SELECT * FROM users", (err, result) => {
    res.render("index", { users: result.rows });
  });
});

//Liste mit Einträgen pro Unterkategorie ausgeben:
app.get("/category/:cat", (req, res) => {
  if (!req.session.benutzerid) {
    res.redirect("/login");
    return;
  }
  pool.query(
    "SELECT LEFT(content, 50) AS content, titel, id FROM posts where category='" +
      req.params.cat +
      "'",
    (error, result) => {
      if (error) {
        throw error;
      }
      let cat = "";
      if (req.params.cat === "photography") {
        cat = "Fotographie";
      } else if (req.params.cat === "layoutandtypography") {
        cat = "Layout & Typographie";
      } else if (req.params.cat === "informatics") {
        cat = "Informatik";
      } else if (req.params.cat === "film") {
        cat = "Filmographie";
      } else if (req.params.cat === "design") {
        cat = "Gestaltung";
      } else if (req.params.cat === "adobe") {
        cat = "Adobe";
      }
      res.render("category", {
        category: result.rows,
        currentcat: cat,
        currentcatdb: req.params.cat
      });
    }
  );
});

//Detailansicht eines Posts anzeigen:
app.get("/post/:id", (req, res) => {
  if (!req.session.benutzerid) {
    res.redirect("/login");
    return;
  }
  pool.query(
    "SELECT * FROM posts WHERE id = $1",
    [req.params.id],
    (error, result) => {
      if (error) {
        throw error;
      }
      res.render("post", { post: result.rows[0] });
    }
  );
});

//Für Erfassung eines neuen Posts:
app.get("/newpost", (req, res) => {
  if (!req.session.benutzerid) {
    res.redirect("/login");
    return;
  }
  res.render("newpost");
});

app.post("/create", (req, res) => {
  pool.query(
    "INSERT INTO posts (titel, content, category) VALUES ($1, $2, $3)",
    [req.body.title, req.body.content, req.body.category],
    (error, result) => {
      if (error) {
        throw error;
      }
      res.redirect("/");
    }
  );
});

//Für Registrierung eines neuen Benutzers:
app.get("/registration_form", (req, res) => {
  res.render("registration_form");
});

app.post("/createuser", function (req, res) {
  var password = bcrypt.hashSync(req.body.password, 10);
  pool.query(
    "INSERT INTO users (email, password) VALUES ($1, $2)",
    [req.body.email, password],
    (error, result) => {
      if (error) {
        throw error;
      }
      res.redirect("/login");
    }
  );
});

// Serverstart
app.listen(port, () => {
  console.log("App listening on port " + port);
});
