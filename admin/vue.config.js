module.exports={
    outputDir:__dirname+ '/../sever/admin' ,
    //看是生产环境还是测试环境
    publicPath:process.env.NODE_ENV === 'production'
    ?'/admin/'
    :'/'
}