// express framework
var express = require('express');
var app = express();
// path 경로를 찾아갈 수 있게 한다.
var path = require('path');
// body-parser : 폼에서 넘어온 객체를 javascript로 매핑
// morgan : post, get 요청이 왔을 시 IDE console에 로깅
var logger = require('morgan');
var bodyParser = require('body-parser');
// csurf 사용하기 위해 선언해준다.
var cookieParser = require('cookie-parser');

//flash 메세지 관련
var flash = require('connect-flash');
//passport 로그인 관련
var passport = require('passport');
var session = require('express-session');

var https = require('https');

// mongodb
var mongoose = require('mongoose');
// promise가 deprecation 되었으므로 다른 것으로 교체
mongoose.Promise = global.Promise;
// 1씩 증가하는 몽구스 오토인크리먼트 함수 추가
var autoIncrement = require('mongoose-auto-increment');
var db = mongoose.connection;
// 접속 실패 시
db.on('error', console.error);
// 접속 성공 시
db.once('open', function(){
    console.log('mongodb connect');
});
// 몽구스로 해당 몽고디비 정보에 접속한다.
var connect = mongoose.connect('mongodb://127.0.0.1:27017/fastcampus', { useMongoClient: true });
// 1씩 증가하는 컬렉션 세팅
autoIncrement.initialize(connect);

// 라우터 모듈
var admin = require('./routes/admin');
var accounts = require('./routes/accounts');
var auth = require('./routes/auth');
var home = require('./routes/home');
var chat = require('./routes/chat');
var products = require('./routes/products');
var cart = require('./routes/cart');
var qna = require('./routes/qna');

// 접속정보
var port = 3001;

// path 모듈을 설치하고 ejs경로를 찾아갈 수 있게 뷰엔진을 추가한다.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// logger, bodyParser 미들웨어로 세팅해준다
// 미들웨어 셋팅
app.use(logger('dev'));
app.use(bodyParser.json());
// url 인코딩을 계속 적용할 것인가 한 번만 적용할 것인가를 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// 업로드일 때 정적 path 추가 
app.use('/uploads', express.static('uploads'));
// static path 추가(장바구니담기)
app.use('/static', express.static('static'));

// session 관련 세팅
// 커넥트 몽고를 로드한 후, 커넥트 몽고 변수에 session정보를 담아서 MongoStore에 담는다.
var connectMongo = require('connect-mongo');
var MongoStore = connectMongo(session);

var sessionMiddleWare = session({
    secret : 'fastcampus',
    resave : false,
    saveUninitialized : true,
    cookie : {
        // 지속시간
        maxAge : 2000 * 60 * 60 
    },
    store : new MongoStore({
        mongooseConnection : mongoose.connection,
        ttl : 14 * 24 * 60 * 60
    })
});

// sessionMiddleWare 사용
app.use(sessionMiddleWare);
// passport 적용
app.use(passport.initialize());
app.use(passport.session());

// flash 메세지 관련
app.use(flash());

app.use(function(req, res, next){
    // 템플릿 어디에서든 isLogin라는 것을 사용할 수 있다.
    // 때문에 어느 페이지에서든 로그인이 되었는지 안되었는지에 대한 체크가 가능하다.
    app.locals.isLogin = req.isAuthenticated();
    next();
});
// app.get으로 페이지 호출
// app.get('/', function(req, res){

//     res.send('app.get : admin app');
// });

// url, admin모듈 객체변수
app.use('/', home); 
app.use('/admin', admin);
app.use('/accounts', accounts);
app.use('/auth', auth);
app.use('/chat', chat);
app.use('/products', products);
app.use('/cart', cart);
app.use('/qna', qna);

// port 정보 및 콘솔 
var server = app.listen(port, function(){
  
    console.log('express framework page port ' + port);
});

var listen = require('socket.io');
var io = listen(server);

io.use(function(socket, next){

    sessionMiddleWare(socket.request, socket.request.res, next);
});

// var socketConnection = require('./libs/socketConnection');
require('./libs/socketConnection')(io);
