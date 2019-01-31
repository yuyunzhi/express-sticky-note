# express-sticky-note


![图图](https://i.loli.net/2018/09/30/5bb09a7139bf9.png)

**关键词：**
- 前端：发布订阅模式、组件化（瀑布流，Toast，note等）、webpack、npm script、less
- 后端：MVC、Express、路由、中间件、sqlite3、服务器部署、onchange插件、ejs模板引擎、pm2

**描述：**
- ASD在线便利贴使用sequelize对数据进行增删改查，通过OAuth2.0实现Github的第三方登陆，通过req.session.user判断户是否登陆的设定权限，使用瀑布流进行布局，当用户添加、删除、修改会弹出Toast，使用pm2持久化网站。

**源码链接：** [进入github](https://github.com/yuyunzhi/express-sticky-note)

**预览链接：** [note01.xyz](http://note01.xyz/)

接下来从以下三个方面来总结。

前端如何实现？后端如何实现？如何部署服务器？

# 一、前端如何实现？

### 1、发布订阅模式

这是我第二次使用发布订阅模式，记得第一次是三个月前做网易云音乐的时候。发布订阅模式可以使得不同的模块解耦，同时通过emit触发自定义事件并传出数据，通过on来监听该事件并执行相应的函数。代码如下：

```
 var EventCenter = (function(){

 var events = {
 //evt:[fn1,fn2,fn3]
 };

 function on(evt, handler){
      events[evt] = events[evt] || []; 
      events[evt].push({
        handler: handler
      });
    }

 function emit(evt, args){
    if(!events[evt]){
        return;
      }
    for(var i=0; i<events[evt].length; i++){
        events[evt][i].handler(args);
      }
    }
 return {
        on: on,
        emit: emit
    }
  })();
```
使用方式：
```
 EventCenter.on('text-change', function(data){
     console.log(data);
 });
 
 EventCenter.emit('text-change', 100);
```

### 2、瀑布流布局

先说思路逻辑，这个弄清楚了就很容易实现了。以下用的是 jquery API

- 先确定所需要布局的空间，放在哪个html的标签容器里：$ct
- 获取该元素的宽度:$ct.width()
- 确定每个note宽度:let nodeWidth = $items.outerWidth(true),
- 得到一共多少列let colNum = parseInt($ct.width()/nodeWidth)
- 获取$ct第一行的子元素高度并且存入数组colSumHeight里
- 判断数组最小的数是第几个下标idx，并获取该值minSumHeight

```
 var idx = 0,
 var minSumHeight = colSumHeight[0];

 for(var i=0;i<colSumHeight.length; i++){
    if(colSumHeight[i] < minSumHeight){
          idx = i;
          minSumHeight = colSumHeight[i];
        }
 }
```

- 对所有子元素进行position:absoulte布局，根据下标idx设置css的left和top值
- 然后把这个note的高度叠加之前的高度放入数组

```
colSumHeight[idx] = $cur.outerHeight(true) + colSumHeight[idx]
```

### 3、Toast

这个函数要实现的是，当我传一个内容在页面弹出该内容,主要就两个步骤:

- 创建一个toast的html并插入到body
- 展示和隐藏，jquery里的fadeIn、fadeOut可以实现

```
function toast(msg,time){
 this.msg=msg;
 this.dismissTime=time||1000;
 this.createToast();
 this.showToast();
}

toast.prototype = {
    createToast:function(){
    var tpl = "<div class='toast'>"+this.msg+"</div>"
    this.$toast = $(tpl)
        $('body').append(this.$toast)
    },
    showToast:function(){
        var self = this
        this.$toast.fadeIn(300,function(){
            setTimeout(function(){
                self.$toast.fadeOut(300,function(){
                    self.$toast.remove()
                });

            },self.dismissTime)
        })

    }
}

function Toast(msg,time){
 return new toast(msg,time)
}
```

### 4、note

这个组件代表的是当我new一个note就会创建一个便利贴，同时该便利贴具备所设定的所有功能。主要四个步骤，把这四个步骤放入Note的prototype里：

```
function Note(opts){
 this.initOpts(opts);
 this.createNote();
 this.setStyle();
 this.bindEvent();
}
```

- initOpts 主要就是为了初始化id 标签的内容
- createNote 根据标签的样式来设定HTML结构并插入到容器中同时确定创建出现的位置
- setStyle 顾名思义设置样式，这里瀑布流布局
- bindEvent 绑定事件包括：鼠标聚焦、鼠标失去焦点、鼠标黏贴、鼠标点击、鼠标移动所触发的事件

具体代码请看我的github源码。

### 5、webpack配置

- 入口为src/js/app/index.js文件，出口为同级的public/js文件里,注意这里使用了__dirname表示的是src之前的目录，这样当整个文件移动到别的地方，都可以根据这个路径找到它
- 配置less，需要安装可以看第6条
- 配置alias，让过长的路径名可以简写

```
var webpack = require('webpack')
var path = require('path')

module.exports = {
    entry:path.join(__dirname,"js/app/index.js"),
    output:{
        path:path.join(__dirname,"../public/js"),
        filename:"index.js"
    },  
    module:{
        rules:[
            {
                test:/\.less$/,
                use:["style-loader","css-loader","less-loader"]
            }

        ]
    },
    resolve:{
        alias:{
            jquery:path.join(__dirname,"js/lib/jquery-3.3.1.min.js"),
            mod:path.join(__dirname,"js/mod"),
            less:path.join(__dirname,"less")
        }
    },
    plugins:[
         new webpack.ProvidePlugin({
            $:"jquery"
        })
    ]
};
```

- 安装onchange，用来watch源码编译到public:[npmjs官网](https://www.npmjs.com/)

```
npm install onchange
```

配置package.json
```
"scripts": {
"start": "node ./bin/www",
"webpack": "webpack --config=src/webpack.config.js",
"watch": "onchange \"src/**/*.js\" \"src/**/*.less\" -- npm run webpack "
},
```

### 6、预处理器Less

- 语法：[点击查看](http://www.bootcss.com/p/lesscss/)
- 安装Less
```
npm install --save css-loader less-loader style-loader less
```
- 在webpack.config.js中配置loader
```
module:{
    rules:{
    test:/\.less$/,
    use:["style-loader","css-loader","less-loader"]
   }
}
```
- 使用时通过require引入less文件

# 二、后端如何实现？

先说一下后端的MVC是什么？当后端得到一个请求后……
- 控制路由跳转的就是控制器C
- 和数据库交互提供良好的接口时M
- 视图就是模板，呈现视图页面V

再说一下，当后端接收到请求后会做什么？
- 发送数据：req.query获取请求路径的参数，从数据库拿到数据res.send()发出去
- 发送页面：根据请求得到数据找到模板，把数据塞到模板中send.render('index',{title:'xxxx'})

### 1、搭建node安装环境
```
npm init -y
//生成package.json
```


### 2、安装express应用生成器

- 官网：[express->](http://www.expressjs.com.cn/starter/generator.html)
- 安装express脚手架，如果不是自己的电脑就尽量不要-g

```
npm install express-generator --save-dev
```

- 然后就可以使用了。使用的命令行，并且安装模板引擎

```
./node_modules/express-generator/bin/express-cli.js . -f -e
```

- 然后安装依赖

```
npm install
```

- 运行

```
npm start
```

### 3、ejs模板引擎

前面已经安装过了ejs了，这里说以下如何设置

- ejs语法 [ejs->](http://www.embeddedjs.com/)
- app.js文件里 app.set()设置模板路径+模板引擎

```
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
```

- 文件目录 注意app.js和views的位置是并列的

### 4、中间件使用

express中间件官网：[express->](http://www.expressjs.com.cn/guide/using-middleware.html)

请求到了，中间加中间件处理完交给下一个环节处理。

注意，当用户请求的是一个文件的时候需要返回一个文件，静态资源处理的中间件是：

```
app.use(express.static(path.join(__dirname, 'public')));
```

如果没有设置则会进入路由中间件

### 5、定前后端的接口


- 获取所有的note GET 
/api/notes 
req:{} 
res:{status:0,data:[{},{}]} 
{status:1,error:'失败原因'}

- 创建一个note POST 
/api/notes/add 
req:{note:"hello world"} 
res:{status:0,data:[{},{}]} 
{status:1,error:'失败原因'}

- 修改一个note POST 
/api/notes/edit 
req:{note:"new note" , id:100} 
res:{status:0,data:[{},{}]} 
{status:1,error:'失败原因'}

- 删除一个note POST 
/api/notes/delete 
req:{id:100} 
res:{status:0,data:[{},{}]} 
{status:1,error:'失败原因'}

请求类型，请求路径，请求状态及带什么参数，相应状态及内容，数据格式。

### 6、安装数据库sequelize

[npmjs->sequelize](https://www.npmjs.com/package/sequelize)

[sequelize官网](https://sequelize.readthedocs.io/en/v3/)

- 安装sequelize

```
npm install --save sequelize
npm install --save sqlite3
```
如果第二个安装失败，可以使用cnpm install sqlite3。反复多装几次。

- 连接数据库
-- 新建文件model/node.js
-- 新建文件夹database 里面会自动创建文件的
-- 下面内容拷贝到node.js

```
var sequelize = new Sequelize(undefined,undefined,undefined, {
host: 'localhost',
dialect: 'sqlite',

storage: '../database/database.sqlite'  //这是储存位置
});

sequelize
.authenticate()
.then(() => {
console.log('Connection has been established successfully.');
})
.catch(err => {
console.error('Unable to connect to the database:', err);
});
```

- 测试连接情况

```
cd model
node node.js
```

成功

```
sequelize deprecated String based operators are now deprecated. Please use  Symbo
l based operators for better security, read more at http://docs.sequelizejs.com/
manual/tutorial/querying.html#operators ..\node_modules\sequelize\lib\sequelize.
js:242:13
Executing (default): SELECT 1+1 AS result
Connection has been established successfully.
```

- 测试增删改查

```
var Note = sequelize.define('note', {
  text:{
    type:Sequelize.STRING
  }
});
Note.sync().then(function(){
    Note.create({
       text:'hello world'
  }).then(function(){
    Note.findAll({raw:true}).then(function(notes){
      console.log(notes)
    })
  })
});
```

查找所有数据，findAll()
查找所有真实数据，findAll({raw:true})
查找id为2的真实数据，findAll({raw:true，where:{id:2}})
删除某个数据，destroy({where:{text:'xxx'}},function(){})
创建某个数据，create({text:notes})
编辑更新某个数据，update({text:req.body.note},{where:{id:req.body.id}})

### 7、OAuth2.0实现第三方登陆

阮一峰文章：[大佬的博客->](http://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html)
使用passport：[github上passport使用方式->](https://github.com/jaredhanson/passport)

这里说下我的逻辑：

- 安装

```
npm install passport
npm install express-session
npm install passport-github
```

- 持久化用户登录

```
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
```

- 添加中间件

```
app.use(session({secret: 'sessionsecret'}));
app.use(passport.initialize());
app.use(passport.session());
```

- 我们点击github登录，发送请求http://域名/auth/github到自己的服务器里，然后后端收到这个请求就会去向GitHub发送认证

```
router.get('/github',passport.authenticate('github'));
```

- 当GitHub认证成功后就会发送一个callback到我们的服务器，这个时候会传给我们一系列该用户的数据。然后后端可以把用户的信息保存到session里

```
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
 function(req, res) {
    req.session.user = {
      id: req.user.id,
      username: req.user.displayName || req.user.username,
      avatar: req.user._json.avatar_url,
      provider: req.user.provider
    };
    res.redirect('/');
  });
```

- 当用户注销的时候，发送http://域名/auth/logout请求时，后端接受后对session进行销毁

```
router.get('/logout', function(req, res){
  req.session.destroy();
  res.redirect('/');
})
```
- 配置github的clientID和clientSecret
这个还是比较简单的:登录github-进入设置-进入developer settings-新建oAuth Apps。配置好后，后端写上：

```
passport.use(new GitHubStrategy({
    clientID: 'xxxxxxxxxxxxxxx',
    clientSecret: 'xxxxxxxxxxxxxxxxxxxxxx',
    callbackURL: "http://xxxxxxxxxxx/auth/github/callback"
  },
 function(accessToken, refreshToken, profile, done) {
 // User.findOrCreate({ githubId: profile.id }, function (err, user) {
 // });
    done(null, profile);
  }
));
```

# 三、如何部署到服务器？

前面做好了都是在本地访问，url为本地localhost:3000，端口可以是3000-9999。要称为"真正"的网页需要做以下步骤：

- 购买域名，阿里云，腾讯云都可以。.xyz结尾是非常便宜的，我这个note01.xyz第一年只要5元。解析域名，指向服务器ip地址。
- 登录远程的服务器，输入账号和密码
- 上传网站代码。使用github clone。远程服务器就是一台新的电脑再上传下载github需要配置一下ssh key。操作方式和本地的电脑一模一样。
- 启动服务器 这里使用的是npm script 所以有两个命令可以启动，npm run start 和node ./bin/www 如果端口被占用就换一个新的端口
- 使用pm2持久化网站

```
pm2 start ./bin/www --name=note01.xyz
pm2 delete xxxxxx
pm2 list
```

- 配置域名映射，添加上你的域名和你的网站使用的 ip 和端口

```
"note01.xyz":"xx.xxx.x.x.x.x.x.x：9999"
```

________________________________________

