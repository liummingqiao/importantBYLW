module.exports = app => {
    const router = require('express').Router()
    const mongoose = require('mongoose')
    // bucause quote date base `s request-all ,use 
    //  const Category = mongoose.model('Category') is OK
    const Category = mongoose.model('Category')
    const Article = mongoose.model('Article')
    const Hero = mongoose.model('Hero')
    // 导入新闻接口
    router.get('/news/init', async (req, res) => {
        //find 新闻资讯 class   
        const parent = await Category.findOne({
            name: '新闻资讯'
        })
        const cate = await Category.find().where({
            parent: parent
        }).lean()
        const newstitle = ["周年庆版本爆料③ | 对局体验大提升，残血不怕打错人！", "周年庆版本爆料② | 装备、技能、野怪现已加入特效套餐！", "网络不在状况？试试腾讯手游加速器", "99公益日，王者峡谷“益”起来", "Pick Me | 喊出我的新皮肤名字~“无限星赏官！”", "9月10日全服不停机优化公告", "9月10日全服不停机更新公告", "净化游戏环境声明及处罚公告（9月1日-9月9日）", "9月10日“演员”惩罚名单", "9月10日外挂专项打击公告", "花好月圆 中秋佳节福利活动周开启", "【预告】峡谷益起做好事 拿专属头像框活动公告", "浓情九月 秋日活动来袭", "最强战队争霸赛入围赛过半，晋级名额争夺激烈！", "乘风破浪闯峡谷 SNK永久英雄免费拿", "【KPL今日预报】QGhappy vs VG，正名之战谁能证明自己？", "你是赛评师：诺言马超首秀胜利，2019E星年？", "【关于王者荣耀赛事积分年与世冠名额获取规则调整公告】", "【KPL三周年】今日原班人马重战六届总决赛 看直播赢KPL限定皮肤礼包！", "触手可及的高校荣耀，第六届高校联赛线上赛道即将开启"]
        // const newstitle = ["1", "2"]
        const newslist = newstitle.map(title => {
            const catrandom = cate.slice(0).sort((a, b) => Math.random() - 0.5);
            return {
                categories: catrandom.slice(0, 2),
                title: title
            }
        })
        // await Article.deleteMany({})
        // await Article.insertMany(newslist)
        res.send(newslist)
    })

    router.get('/news/list', async (req, res) => {
        // populate 是简单的查询
        // const parent = await Category.findOne({
        //     name: '新闻资讯'
        // }).populate({
        //     path: 'children',
        //     populate: {
        //         path: 'newslist'
        //     }
        // }).lean()
        const parent = await Category.findOne({
            name: '新闻资讯'
        })
        //聚合查询 多管道查询 aggregate
        const cats = await Category.aggregate([
            //过滤数据 （查找所有Par字段里边id为Par的字段 ）
            { $match: { parent: parent._id } },
            //关联查询
            {
                $lookup: {
                    from: 'articles',
                    localField: '_id',
                    foreignField: 'categories',
                    as: 'newslist'
                }
            },
            // 修改
            {
                $addFields: {
                    newslist: { $slice: ['$newslist', 5] }
                }
            }
        ])
        const subCats = cats.map(el => el._id)
        cats.unshift({
            name: '热门',
            newslist: await Article.find({
                categories: { $in: subCats }
            }).populate('categories').limit(5).lean()
        })
        //热门前边的标题是不能是热门 所以需要改一下
        cats.map(cat => {
            cat.newslist.map(news => {
                news.categoryName = (cat.name === '热门') ? news.categories[0].name : cat.name
                return news
            })
            return cat
        })

        res.send(cats)
    })
    //批量录入英雄数据
    router.get('/heros/info', async (req, res) => {
        //    await Hero.deleteMany({})
        //     const heros = [{ "name": "热门", "hero": [{ "name": "鲁班七号", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/112/112.jpg" }, { "name": "孙悟空", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/167/167.jpg" }, { "name": "铠", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/193/193.jpg" }, { "name": "后羿", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/169/169.jpg" }, { "name": "孙尚香", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/111/111.jpg" }, { "name": "亚瑟", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/166/166.jpg" }, { "name": "妲己", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/109/109.jpg" }, { "name": "甄姬", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/127/127.jpg" }, { "name": "安琪拉", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/142/142.jpg" }, { "name": "韩信", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/150/150.jpg" }] }, { "name": "战士", "hero": [{ "name": "赵云", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/107/107.jpg" }, { "name": "钟无艳", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/117/117.jpg" }, { "name": "吕布", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/123/123.jpg" }, { "name": "曹操", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/128/128.jpg" }, { "name": "典韦", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/129/129.jpg" }, { "name": "宫本武藏", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/130/130.jpg" }, { "name": "达摩", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/134/134.jpg" }, { "name": "老夫子", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/139/139.jpg" }, { "name": "关羽", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/140/140.jpg" }, { "name": "露娜", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/146/146.jpg" }, { "name": "花木兰", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/154/154.jpg" }, { "name": "亚瑟", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/166/166.jpg" }, { "name": "孙悟空", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/167/167.jpg" }, { "name": "刘备", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/170/170.jpg" }, { "name": "杨戬", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/178/178.jpg" }, { "name": "雅典娜", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/183/183.jpg" }, { "name": "哪吒", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/180/180.jpg" }, { "name": "铠", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/193/193.jpg" }, { "name": "狂铁", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/503/503.jpg" }, { "name": "李信", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/507/507.jpg" }, { "name": "盘古", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/529/529.jpg" }, { "name": "曜", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/522/522.jpg" }, { "name": "马超", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/518/518.jpg" }] }, { "name": "法师", "hero": [{ "name": "小乔", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/106/106.jpg" }, { "name": "墨子", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/108/108.jpg" }, { "name": "妲己", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/109/109.jpg" }, { "name": "嬴政", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/110/110.jpg" }, { "name": "高渐离", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/115/115.jpg" }, { "name": "扁鹊", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/119/119.jpg" }, { "name": "芈月", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/121/121.jpg" }, { "name": "周瑜", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/124/124.jpg" }, { "name": "甄姬", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/127/127.jpg" }, { "name": "武则天", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/136/136.jpg" }, { "name": "貂蝉", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/141/141.jpg" }, { "name": "安琪拉", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/142/142.jpg" }, { "name": "姜子牙", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/148/148.jpg" }, { "name": "王昭君", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/152/152.jpg" }, { "name": "张良", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/156/156.jpg" }, { "name": "不知火舞", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/157/157.jpg" }, { "name": "钟馗", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/175/175.jpg" }, { "name": "诸葛亮", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/190/190.jpg" }, { "name": "干将莫邪", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/182/182.jpg" }, { "name": "女娲", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/179/179.jpg" }, { "name": "杨玉环", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/176/176.jpg" }, { "name": "弈星", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/197/197.jpg" }, { "name": "米莱狄", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/504/504.jpg" }, { "name": "沈梦溪", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/312/312.jpg" }, { "name": "上官婉儿", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/513/513.jpg" }, { "name": "嫦娥", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/515/515.jpg" }] }, { "name": "坦克", "hero": [{ "name": "廉颇", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/105/105.jpg" }, { "name": "刘禅", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/114/114.jpg" }, { "name": "白起", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/120/120.jpg" }, { "name": "夏侯惇", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/126/126.jpg" }, { "name": "项羽", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/135/135.jpg" }, { "name": "程咬金", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/144/144.jpg" }, { "name": "刘邦", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/149/149.jpg" }, { "name": "牛魔", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/168/168.jpg" }, { "name": "张飞", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/171/171.jpg" }, { "name": "东皇太一", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/187/187.jpg" }, { "name": "苏烈", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/194/194.jpg" }, { "name": "梦奇", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/198/198.jpg" }, { "name": "孙策", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/510/510.jpg" }, { "name": "猪八戒", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/511/511.jpg" }] }, { "name": "刺客", "hero": [{ "name": "阿轲", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/116/116.jpg" }, { "name": "李白", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/131/131.jpg" }, { "name": "韩信", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/150/150.jpg" }, { "name": "兰陵王", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/153/153.jpg" }, { "name": "娜可露露", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/162/162.jpg" }, { "name": "橘右京", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/163/163.jpg" }, { "name": "百里玄策", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/195/195.jpg" }, { "name": "裴擒虎", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/502/502.jpg" }, { "name": "元歌", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/125/125.jpg" }, { "name": "司马懿", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/137/137.jpg" }, { "name": "云中君", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/506/506.jpg" }] }, { "name": "射手", "hero": [{ "name": "孙尚香", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/111/111.jpg" }, { "name": "鲁班七号", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/112/112.jpg" }, { "name": "马可波罗", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/132/132.jpg" }, { "name": "狄仁杰", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/133/133.jpg" }, { "name": "后羿", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/169/169.jpg" }, { "name": "李元芳", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/173/173.jpg" }, { "name": "虞姬", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/174/174.jpg" }, { "name": "成吉思汗", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/177/177.jpg" }, { "name": "黄忠", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/192/192.jpg" }, { "name": "百里守约", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/196/196.jpg" }, { "name": "公孙离", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/199/199.jpg" }, { "name": "伽罗", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/508/508.jpg" }] }, { "name": "辅助", "hero": [{ "name": "庄周", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/113/113.jpg" }, { "name": "孙膑", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/118/118.jpg" }, { "name": "蔡文姬", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/184/184.jpg" }, { "name": "太乙真人", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/186/186.jpg" }, { "name": "大乔", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/191/191.jpg" }, { "name": "鬼谷子", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/189/189.jpg" }, { "name": "明世隐", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/501/501.jpg" }, { "name": "盾山", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/509/509.jpg" }, { "name": "瑶", "avatar": "http://game.gtimg.cn/images/yxzj/img201606/heroimg/505/505.jpg" }] }]
        //     for (let cat of heros) {
        //         if (cat.name === '热门') {
        //             continue
        //         }

        //         //在数据库中录入数据 
        //         const category = await Category.findOne({
        //             name: cat.name
        //         })
        //         cat.hero =  cat.hero.map(hero_1 => {
        //             hero_1.categories = [category]
        //             return hero_1
        //         })
        //         await Hero.insertMany(cat.hero)
        //     }
        res.send(await Hero.find())
    })

    // 英雄接口
    router.get('/heros/list', async (req, res) => {
        const parent = await Category.findOne().where({
            name: '英雄分类'
        })
        const cats = await Category.aggregate([
            //过滤数据 （查找所有Par字段里边id为Par的字段 ）
            { $match: { parent: parent._id } },
            //关联查询
            {
                $lookup: {
                    from: 'herose',//从哪个原形向外挑出数据
                    localField: '_id',//本地的来源ID
                    foreignField: 'categories',// 外来源于categories 模型
                    as: 'herolist'
                }
            },
        ])
        const subCats = cats.map(el => el._id)
        cats.unshift({
            name: '热门',
            herolist: await Hero.find({
                categories: { $in: subCats }
            }).populate('categories').limit(10).lean()
        })
        res.send(cats)
    })
    //
    router.get('/article/:id', async (req, res) => {
        const data = await Article.findById(req.params.id).lean()
        // console.log(date);
        data.related = await Article.find().where({
            categories: { $in: data.categories }
        }).limit(2)
        res.send(data)
    })
    router.get('/hero/:id', async (req, res) => {
        const data = await Hero.findById(req.params.id).populate('categories').lean()
        res.send(data)
    })
    app.use('/web/api', router);
}