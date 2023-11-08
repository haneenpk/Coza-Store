const multer = require('multer');
const sharp =  require('sharp')
const path = require('path')
const { v4 } = require('uuid')

const storage = multer.memoryStorage();

const fileFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  }else{
    cb(err,false)
  }
}
const upload = multer({ storage, fileFilter })

// Products
exports.uploadProductImages = upload.fields([
  {
    name: 'images',
    maxCount: 3
  }
])

exports.resizeProductImages = async (req, res, next) => {
  if(!req.files.images) return next();
  req.body.images = []
  await Promise.all(
    req.files.images.map(async(file) => {
      const filename = `product-${v4()}.jpeg`
      await sharp(file.buffer)
        .resize(640,640)//640
        .toFormat('jpeg')
        .jpeg( { quality:90 } )
        .toFile(path.join(__dirname, '../public', 'products', filename))

        req.body.images.push(filename)
    })
  )
  next()
}


// Profile
exports.uploadProfileImage = upload.single('image');

exports.resizeProfileImage =async  (req,res,next) => {
  try {
    if(!req.file) return next();
    req.file.originalname = `userProfile-${Date.now()}.png`;
    req.body.image = `/userProfile/${req.file.originalname}`
    await sharp(req.file.buffer)
    .resize(300,300)
    .toFormat('jpeg')
    .png({quality:90}).toFile(`public/userProfile/${req.file.originalname}`);
    next();
    
  } catch (error) {
    console.log(error.message)
  }
}

// Banner
exports.uploadBannerImage = upload.single('image');

exports.resizeBannerImage =async  (req,res,next) => {
  try {
    if(!req.file) return next();
    req.file.originalname = `banner-${Date.now()}.png`;
    req.body.image = `/banner/${req.file.originalname}`
    await sharp(req.file.buffer)
    .toFormat('jpeg')
    .png({quality:90}).toFile(`public/banner/${req.file.originalname}`);
    next();
    
  } catch (error) {
    console.log(error.message)
  }
}
