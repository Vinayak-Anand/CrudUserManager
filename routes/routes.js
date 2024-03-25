const express =require('express');
const router=express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');
//image upload
var storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads');
    },
    filename: function(req,file,cb){
        cb(null,file.fieldname+"_"+Date.now()+"_"+file.originalname);
    }
})

var upload = multer({
    storage:storage
}).single('image');

router.post("/add", upload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded', type: 'danger' });
        }

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename
        });

        await user.save();
        req.session.message = {
            type: 'success',
            message: 'User added successfully'
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});



router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.render('index', { title: 'HomePage', users: users });
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});


router.get('/add',(req,res)=>{
    res.render('add_users',{title: 'Add Users'})
});

//Edit user
router.get('/edit/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.render('edit_users', { title: 'Edit User', user: user });
    } catch (err) {
        res.redirect('/');
    }
});

//Update user
router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';
  
    if (req.file) {
      new_image = req.file.filename;
      try {
        fs.unlinkSync('./uploads/' + req.body.old_image);
      } catch (err) {
        console.log(err);
      }
    } else {
      new_image = req.body.old_image;
    }
  
    try {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          image: new_image,
        },
        { new: true }
      );
  
      req.session.message = {
        type: 'success',
        message: 'User updated successfully!',
      };
      res.redirect('/');
    } catch (err) {
      res.json({ message: err.message, type: 'danger' });
    }
  });

//Delete user
router.get('/delete/:id', async (req, res) => {
    let id = req.params.id;
  
    try {
      // Find the user by ID and remove it
      const deletedUser = await User.findByIdAndDelete(id);
  
      // If the user was not found, handle it appropriately
      if (!deletedUser) {
        req.session.message = {
          type: 'danger',
          message: 'User not found',
        };
        return res.redirect('/');
      }
  
      // Delete the user's image file
      if (deletedUser.image) {
        try {
          fs.unlinkSync('./uploads/' + deletedUser.image);
        } catch (err) {
          console.log(err);
        }
      }
  
      req.session.message = {
        type: 'success',
        message: 'User deleted successfully!',
      };
      res.redirect('/');
    } catch (err) {
      res.json({ message: err.message, type: 'danger' });
    }
  });
  
module.exports=router;