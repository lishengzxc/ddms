var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var everyauth = require('everyauth');
var mongoose = require('mongoose');
var restify = require('express-restify-mongoose');
var dbUrl = process.env.MONGOHQ_URL || 'mongodb://@localhost:27017/ddms_db';
var db = mongoose.connect(dbUrl, {safe: true});

var models = require('./models');
var routes = require('./routes/index');
var apis = require('./apis/index');

//middlewares
var authorize = require('./middlewares/authorize');
var writeLog = require('./middlewares/writeLog');
var twitterLogin = require('./middlewares/twitterLogin');

//first time runing the app
//generate a admin user
routes.user.genAdmin(models.User);

var app = express();
app.enable('trust proxy');
app.locals.appTitle = "DDMS";

app.use(function (req, res, next) {
  if (!models.User) return next(new Error("No models."));
  req.models = models;
  return next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine({ jsx: { harmony: true } }));

twitterLogin(models,routes);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(methodOverride());
app.use(cookieParser('/Eh@5Pfu/+"M+0[QDR3bJ$nd}<AZew]7y}4tdPtAB2=]m+JsuhOX?Gd"FzK;F.G>'));
app.use(session({secret: '/Eh@4Pfu/+"M+0[QDR3bJ$nd}<AZew]7y}4tePtAB2=]m+JsuhOX?Gd"FzKL;F.G>',saveUninitialized: true, resave: true}));
app.use(everyauth.middleware());
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  if (req.session && req.session.admin)
    res.locals.admin = true;
  next();
});

//route page
//app.get('/', routes.index);
//user
//CRUD
app.get('/', routes.user.login);
app.get('/login', routes.user.login);
app.post('/login', routes.user.authenticate);
//if you use everyauth, this /logout route is overwriting by everyauth automatically, therefore we use custom/additional handleLogout
app.get('/logout', writeLog, routes.user.logout);
app.get('/admin', writeLog, authorize.editor, routes.admin.index);
app.get('/users', writeLog, authorize.editor, routes.user.showList);
app.get('/users/create', writeLog, authorize.editor, routes.user.showCreateUser);
app.post('/users/create', writeLog, authorize.administrator, routes.user.createUser);
app.get('/users/update/:id', writeLog, authorize.editor, routes.user.showUpdateUser);
app.post('/users/update', writeLog, authorize.editor, routes.user.updateUser);
app.get('/users/delete/:id', writeLog, authorize.administrator, routes.user.deleteUser);

//project
//CRUD
app.get('/projects', writeLog, authorize.editor, routes.project.showList);
app.get('/projects/create', writeLog, authorize.editor, routes.project.showCreateProject);
app.post('/projects/create', writeLog, authorize.editor, routes.project.createProject);
app.get('/projects/update/:id', writeLog, authorize.editor, routes.project.showUpdateProject);
app.post('/projects/update', writeLog, authorize.editor, routes.project.updateProject);
app.get('/projects/delete/:id', writeLog, authorize.editor, routes.project.deleteProject);

//form
//CRUD
app.get('/formsall', writeLog, authorize.editor, routes.form.showList);
app.get('/forms/:projectid', writeLog, authorize.editor, routes.form.showListByProjectId);
app.get('/forms/create/:projectid', writeLog, authorize.editor, routes.form.showCreateForm);
app.post('/forms/create/:projectid', writeLog, authorize.editor, routes.form.createForm);
app.get('/forms/update/:id', writeLog, authorize.editor, routes.form.showUpdateForm);
app.post('/forms/update', writeLog, authorize.editor, routes.form.updateForm);
app.get('/forms/delete/:id', writeLog, authorize.editor, routes.form.deleteForm);
app.get('/forms/copy/:id', writeLog, authorize.editor, routes.form.copyForm);

//form data
//CRUD
app.get('/formdatas/:formid', writeLog, authorize.editor, routes.formData.showList);
app.get('/formdatas/create/:formid', writeLog, authorize.editor, routes.formData.showCreateData);
app.post('/formdatas/create/:formid', writeLog, authorize.editor, routes.formData.createData);
app.get('/formdatas/update/:id', writeLog, authorize.editor, routes.formData.showUpdateData);
app.post('/formdatas/update/:id', writeLog, authorize.editor, routes.formData.updateData);
app.get('/formdatas/delete/:id', writeLog, authorize.editor, routes.formData.deleteData);

//image
//CRUD
app.get('/images/', writeLog, authorize.editor, routes.image.showList);
app.get('/images/create/', writeLog, authorize.editor, routes.image.showCreateImage);
app.post('/images/create/', writeLog, authorize.editor, routes.image.createImage);
app.get('/images/delete/:id', writeLog, authorize.editor, routes.image.deleteImage);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
