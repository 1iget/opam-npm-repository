
exports.setup = function(){
    exports.setupArgs = arguments
}

exports.handle = function(req, res, next){
    req.body = ''
    req.setEncoding('utf8')
    req.addListener('data', function(chunk){
        req.body += chunk
    })
    req.addListener('end', function(){
        req.body = req.body.toUpperCase()
        next(null, req, res)
    })
}