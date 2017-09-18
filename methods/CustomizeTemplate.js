/**
 * Created by th3ee on 9/17/17.
 */
var mongoose = require('mongoose');
var jwt = require('jwt-simple');
var nodemailer = require('nodemailer');
var temp = require('../model/saveTemp');
var template = require('../model/template');
var config = require('../config/database');
var ejs = require('ejs');
var Schema = mongoose.Schema;

var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};


var compileModel = function (tempName) {
   return template.findOne({'templateName': tempName}).exec(function (err, temp) {
        if (compiler !== tempName) {
            mongoose.model(tempName, new Schema(temp.attributes));
            compiler = tempName;
        } else {
            console.log('already compiled')
        }
    })
};

var senderror = function (err) {
    return res.status(403).send({msg: 'Something Wrong', error: err});
};

var compiler = 'null';

var functions = {


    
    saveSchema: function (req, res) {
        console.log(req.body);
            var Template = temp({
                tempName: req.body.tempName,
                format: req.body.format
            });
            console.log(Template);
        Template.save(function(err){
            if (err){
                res.json({success:false, msg:'Failed to save'})
            }

            else {
                res.json({success:true, msg:'Successfully saved'});
            }
        })
    },
    
    getModel: function (req ,res) {
        temp.findOne({'tempName': req.body.tempName}).exec(function (err, temp) {
            if (err) senderror(err);
            else sendJSONresponse(res, 200, temp);
        })
    },

    getAllModel: function (req ,res) {
        temp.find().exec(function (err, temps) {
            if (err) senderror(err);
            else sendJSONresponse(res, 200, temps);
        })
    },

    deleteModel: function (req ,res) {
        temp.remove().exec(function (err) {
            if (err) senderror(err);
            else sendJSONresponse(res, 200, {delete_success: true});
        })
    },
    
    createSchema: function (req, res) {
        var inital_temp = template(req.body);
        inital_temp.save(function (err) {
            if (err) senderror(err);
            else sendJSONresponse(res, 200, {success:true})
        })
    },

    getTheReport: function (req, res) {
        var conn = mongoose.connect('mongodb://localhost:27017');
        console.log(compileModel(req.body.templateName));
        compileModel(req.body.templateName).then(function () {
            conn.model(req.body.templateName).find().exec(function (err, doc) {
                if(err) senderror(err);
                else sendJSONresponse(res, 200, doc);
            })
        });
    },

    SaveReport: function (req, res) {
        var conn = mongoose.connect('mongodb://localhost:27017');
        compileModel(req.body.templateName).then(function () {
            var Model = conn.model(req.body.templateName);
            var newRecord = Model(req.body.attributes);
            newRecord.save(function (err) {
                if (err) senderror(err);
                else sendJSONresponse(res, 200, {save_success:true})
            })
        });
    },

    deleteTempReport: function (req, res) {
        var conn = mongoose.connect('mongodb://localhost:27017');
        console.log(compileModel(req.body.templateName));
        compileModel(req.body.templateName).then(function () {
            conn.model(req.body.templateName).remove().exec(function (err) {
                if(err) senderror(err);
                else sendJSONresponse(res, 200, {delete_success:true});
            })
        });
    },

    getTemplate: function (req, res) {
        template.find().exec(function (err, temps) {
            if (err) senderror(err);
            else sendJSONresponse(res, 200, temps)
        })
    }
};



module.exports = functions;
