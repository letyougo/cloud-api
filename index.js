/**
 * Created by xiaoxiaosu on 17/4/20.
 */

var express = require('express')
var app = new express()
var path = require('path')
var fs = require('fs')
var url = require('url')
var shelljs = require('shelljs')
var cdnName = 'cdn'
var cdnPath = path.join(__dirname,'cdn')


var jsonApi = [
    '/filelist',
    '/filemove'
]

function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1000, // or 1024
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

app.use(function (req, res,next) {
    var u = url.parse(req.url).pathname
    var isJsonApi = jsonApi.find(function (url) {
        return new RegExp('^'+url).test(u)
    })
    if(isJsonApi){
        res.set('Content-type','application/json')
    }
    next()
})
app.use('/'+cdnName,express.static(cdnPath))
app.get('/filelist',function (req, res) {
    var p = path.join(cdnPath,req.query.path || '')
    var list = fs.readdirSync(p)

    list = list.map(function (name) {
        var detail = fs.statSync(path.join(cdnPath,name))
        return {
            path:path.join(cdnPath,name),
            ext:path.extname(name),
            folder:detail.isDirectory(),
            size:bytesToSize(detail.size),
            url:path.join(cdnName,req.query.path || '',name )
        }
    })

    res.send(list)
})

app.get('/filemove',function (req, res) {
    var from = path.join(cdnPath,req.query.from || '')
    var to = path.join(cdnPath,req.query.to || '')

    var commander = shelljs.exec('mv '+from + ' '+to)
    res.send({
        from:from,
        to:to,
        url:path.join(cdnName,req.query.to || '' ),
        message: commander.code == 0?'successful':commander.stderr
    })
})

app.get('/fileremove',function (req,res) {
    var path = path.join(cdnPath,req.query.path || '')


    var commander = shelljs.exec('rm -rf '+path)
    res.send({
        path:path,
        url:path.join(cdnName,req.query.to || '' ),
        message: commander.code == 0?'successful':commander.stderr
    })
})

app.get('/foldercreate',function (req, res) {
    var name = req.query.name
    var path = req.query.path
    var p = path.join(cdnPath,path || '')
    if(fs.existsSync(p)){
        return res.send({
            message:'folder exist,please rename'
        })
    }

})
app.listen(8082)