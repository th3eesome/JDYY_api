/**
 * Created by th3ee on 7/30/17.
 */
var User = require('../model/user');
var Item = require('../model/item');
var Hero = require('../model/hero');
var Report = require('../model/report');
var NewReport = require('../model/newReport');
var ReportRecord = require('../model/reportRecord');
var Group = require('../model/group');
var Temp = require('../model/saveTemp');
var Meet = require('../model/meetItem');
var ReportPic = require('../model/reportPic');
var Script = require('../model/scriptReport');
var mongoose = require('mongoose');
var config = require('../config/database');
var jwt = require('jwt-simple');
var nodemailer = require('nodemailer');
var ejs = require('ejs');
var userSchema = require('../model/user');


var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

var senderror = function (err) {
    return res.status(403).send({msg: 'Something Wrong', error: err});
};

var functions = {
    getLocalItem: function (req, res) {
            Item.find({'$and': [{'sendHospital': req.body.hospital}]}).exec(function (err, items) {
                if (err) {
                    senderror(err);
                }
                else {
                    sendJSONresponse(res, 200, items);
                }
            })
    },
    getApplyedItem: function (req, res) {
        if (req.body.level){
           if (req.body.level.indexOf('一线医师') > -1) {
            Item.find({'$and': [{'sendHospital': req.body.hospital}, {'destination': '--'}, {'applystatus':{'$nin':['待申请']}}]}).exec(function (err, items) {
                if (err) {
                    senderror(err);
                }
                else {
                    sendJSONresponse(res, 200, items);
                }
            })
           } else {
            Item.find({'$and': [{'sendHospital': req.body.hospital}, {'destination': '--'}, {'$or':[{'status': '待审核'},{'status': '审核中'},{'status': '已审核'}]}]}).exec(function (err, items) {
                if (err) {
                    senderror(err);
                }
                else {
                    sendJSONresponse(res, 200, items);
                }
            })
        }
        } else {
            Item.find({'$and': [{'sendHospital': req.body.hospital}, {'destination': '--'}, {'applystatus':{'$nin':['待申请']}}]}).exec(function (err, items) {
                if (err) {
                    senderror(err);
                }
                else {
                    sendJSONresponse(res, 200, items);
                }
            })
        }
    },

    getSendingItem: function (req, res) {
        Item.find({'$and':[{'sendHospital': req.body.hospital},{'destination': {'$nin': ['--']}}]}).exec(function (err, items) {
            if (err) {
                senderror(err);
            }
            else {
                sendJSONresponse(res, 200 ,items);
            }
        })
    },

    getApplication: function (req, res) {
        Item.find({'$and':[{'destination': req.body.hospital}, {'transferstatus': '等待接收'}]}).exec(function (err, items) {
            if (err) {
                senderror(err);
            }
            else {
                sendJSONresponse(res, 200 ,items);
            }
        })
    },

    sendApplication: function (req,res) {
        Item.findOneAndUpdate({'examID': req.body.examID}, {
            'destination': req.body.destination,
            'transferstatus': '等待接收',
            'applyDoc': req.body.doctor,
            'transReason': req.body.reason
        }, function (err) {
            if (err) {
                senderror(err);
            } else {
                sendJSONresponse(res, 200, {msg: 'send success'});
            }
        })
    },

    getOtherItem: function (req, res) {
        if (req.body.level) {
        if (req.body.level.indexOf('一线医师')>-1) {
        Item.find({'$and':[{'destination': req.body.hospital},{'transferstatus': '已接收'}]}).exec(function (err, items) {
            if (err) {
                senderror(err);
            }
            else {
                sendJSONresponse(res, 200 ,items);
            }
        })
        } else {
            Item.find({'$and':[{'destination': req.body.hospital},{'transferstatus': '已接收'}, {'$or':[{'status': '待审核'},{'status': '审核中'},{'status': '已审核'}]}]}).exec(function (err, items) {
                if (err) {
                    senderror(err);
                }
                else {
                    sendJSONresponse(res, 200 ,items);
                }
            })
        }} else {
            Item.find({'$and': [{'destination': req.body.hospital}, {'transferstatus': '已接收'}]}).exec(function (err, items) {
                if (err) {
                    senderror(err);
                }
                else {
                    sendJSONresponse(res, 200, items);
                }
            })
        }
    },

    acceptApplication: function (req, res) {
        Item.findOneAndUpdate({'examID': req.body.examID}, {'transferstatus': '已接收', 'responsible': '--'}, function (err) {
            if (err) {
                senderror(err);
            } else {
                sendJSONresponse(res, 200, { msg : 'accept success'});
            }
        })
    },

    rejectApplication: function (req, res) {
        Item.findOneAndUpdate({'examID': req.body.examID}, {'transferstatus': '已拒绝', 'rejection': req.body.rejection}, function (err) {
            if (err) {
                senderror(err);
            } else {
                sendJSONresponse(res, 200, { msg : 'reject success'});
            }
        })
    },

    AcceptRejection: function (req, res) {
        Item.findOneAndUpdate({'examID': req.body.examID}, {
            'transferstatus': '--',
            'rejection': '--',
            'destination': '--',
            'applyDoc': '--',
            'transReason': '--'
        }, function (err) {
            if (err) {
                senderror(err);
            } else {
                sendJSONresponse(res, 200, { msg : 'accept rejection'});
            }
        })
    },

    PickItem: function (req, res) {
        Item.findOne({'examID': req.body.examID}).exec(function (err, item) {
            if (err) senderror(err);
            else {
                if (item.owner !== '--') {
                    Item.findOneAndUpdate({'examID': req.body.examID}, {
                        'responsible': req.body.doctor,
                        'origin': 'picked'
                    }, function (err) {
                        if (err) {
                            senderror(err);
                        } else {
                            sendJSONresponse(res, 200, { msg: 'You have picked the item'});
                        }
                    })
                } else {
                    Item.findOneAndUpdate({'examID': req.body.examID}, {
                        'owner': req.body.doctor,
                        'responsible': req.body.doctor,
                        'origin': 'picked'
                    }, function (err) {
                        if (err) {
                            senderror(err);
                        } else {
                            sendJSONresponse(res, 200, { msg: 'You have picked the item'});
                        }
                    })
                }
            }
        })
    },

    DistributeItem: function (req, res) {
        Item.findOne({'examID': req.body.examID}).exec(function (err, item) {
            if (err) senderror(err);
            else {
                if (item.owner !== '--') {
                    Item.findOneAndUpdate({'examID': req.body.examID}, {
                        'responsible': req.body.doctor,
                        'origin': 'distributed'
                    }, function (err) {
                        if (err) {
                            senderror(err);
                        } else {
                            sendJSONresponse(res, 200, { msg: 'You have distributed the item'});
                        }
                    })
                } else {
                    Item.findOneAndUpdate({'examID': req.body.examID}, {
                        'owner': req.body.doctor,
                        'responsible': req.body.doctor,
                        'origin': 'distributed'
                    }, function (err) {
                        if (err) {
                            senderror(err);
                        } else {
                            sendJSONresponse(res, 200, { msg: 'You have distributed the item'});
                        }
                    })
                }
            }
        })
    },

    GetOwner: function (req, res) {
        Item.findOne({'examID': req.body.examID}).exec(function (err, item) {
            if (err) {
                senderror(err);
            } else {
                if (item)
                sendJSONresponse(res, 200, item.owner);
                else
                    sendJSONresponse(res, 200, {status: 'this item get picked by nobody!'});
            }
        })
    },

    GetResponsible: function (req, res) {
        Item.findOne({'examID': req.body.examID}).exec(function (err, item) {
            if (err) {
                senderror(err);
            } else {
                if (item)
                    sendJSONresponse(res, 200, item.responsible);
                else
                    sendJSONresponse(res, 200, {status: 'this item is responsible to nobody!'});
            }
        })
    },

    GetOwnItems: function (req, res) {
        Item.find({'$and': [
            {'responsible': req.body.doctor},
            {'$or': [
            {'$and':[{'sendHospital': req.body.hospital},{'destination': '--'}]},
            {'$and':[{'destination': req.body.hospital},{'transferstatus': '已接收'}]}
            ]}
            ]}
            ).exec(function (err, items) {
            if (err) {
                senderror(err);
            } else {
                sendJSONresponse(res, 200, items)
            }
        })
    },

    SavePic: function (req, res) {
        if(!req.body.examID || !req.body.picID){
            console.log(req.body);
            res.json({success: false, msg: 'You must have a examID'});
        }
        else{
            ReportPic.findOne({'$and': [{'examID': req.body.examID},{'picID': req.body.picID}]}).exec(function (err, item) {
                if (item) {
                    sendJSONresponse(res, 204, {pic_already_existed: true});
                } else {
                    var newItem = ReportPic(req.body);
                    newItem.save(function (err) {
                        if(err){
                            sendJSONresponse(res,404,err);
                        }
                        else{
                            sendJSONresponse(res,200,{success: true});
                        }
                    })
                }
            });
            console.log(req.body);
        }
    },

    GetPic: function (req, res) {
        ReportPic.find({'examID': req.body.examID}
        ).exec(function (err, items) {
            if (err) {
                senderror(err);
            } else {
                sendJSONresponse(res, 200, items)
            }
        })
    },

    ClearPic: function (req, res) {
        ReportPic.remove({'examID': req.body.examID}).exec(
            function (err) {
                if (err) {
                    senderror(err);
                } else {
                    sendJSONresponse(res, 200, {remove_success: true});
                }
            }
        )
    },

    Remove: function (req, res) {
        Item.remove(true,function (err) {
            if (err) senderror(err);
            sendJSONresponse(res ,200, {item_delete_success: true});
        });
        Hero.remove(true,function (err) {
            if (err) senderror(err);
            console.log('hero_deleted');
        });
        Meet.remove(true,function (err) {
            if (err) senderror(err);
            console.log('meeting_deleted');
        });
        Report.remove(true,function (err) {
            if (err) senderror(err);
           console.log('report_deleted');
        });
        ReportRecord.remove(true,function (err) {
            if (err) senderror(err);
            console.log('record_deleted');
        });
        Script.remove(true,function (err) {
            if (err) senderror(err);
            console.log('script_removed');
        });
        ReportPic.remove(true,function (err) {
            if (err) senderror(err);
            console.log('reportPic_removed');
        });
        NewReport.remove(true,function (err) {
            if (err) senderror(err);
            console.log('newReport_removed');
        });
    },

    Refresh: function (req, res) {
        var NewItems =[
            {'examID': 'F0000285', 'patientID':'0001265492', 'name':'尤竹荣', 'gender':'女', 'age':'64', 'examContent': 'CT', 'examPart': '胸部 肺刺穿', 'sendHospital':'交大一附院', 'time': '2015-10-13'},
            {'examID': 'F0000286', 'patientID':'0001265492', 'name':'尤竹荣', 'gender':'女', 'age':'64', 'examContent': 'ECT', 'examPart': '全身骨显像', 'sendHospital':'交大一附院', 'time': '2016-11-10'},
            {'examID': 'F0000289', 'patientID':'0001265492', 'name':'尤竹荣', 'gender':'女', 'age':'64', 'examContent': 'CT', 'examPart': '盆腔 上腹部 中腹部 下腹部 胸部 平扫', 'sendHospital':'交大一附院', 'time': '2017-04-17'},
            {'examID': 'F0000141', 'patientID':'0001176267', 'name':'王朋', 'gender':'男', 'age':'45', 'examContent': 'CR[床头拍片]', 'examPart': '肺部', 'sendHospital':'交大一附院', 'time': '2014-10-18'},
            {'examID': 'F0000142', 'patientID':'0001176267', 'name':'王朋', 'gender':'男', 'age':'45', 'examContent': 'ECT', 'examPart': '全身骨显像', 'sendHospital':'交大一附院', 'time': '2015-01-07'}
            ];
        NewItems.forEach(function (d) {
            var mainID = d.examID;
            var item = Item({
                patientID: d.patientID,
                examID: d.examID,
                name: d.name,
                gender: d.gender,
                age: d.age,
                examContent: d.examContent,
                examPart: d.examPart,
                sendHospital: d.sendHospital,
                reportDoc: '--',
                reporttime: '--',
                time: d.time,
                status: '待书写',
                applystatus: '待申请',
                destination: '--',
                transferstatus: '--',
                rejection: '--',
                applyDoc: '--',
                transReason: '--',
                owner: '--',
                responsible: '--',
                origin: '--',
                screenShot: []
            });
            var report = Report({
                patientID: d.patientID,
                examID: d.examID,
                name: d.name,
                age: d.age,
                gender: d.gender,
                examContent: d.examContent,
                examPart: d.examPart,
                date: d.time,
                reporttime: '--',
                reportDoc: '--',
                verifyDoc: '--',
                status: '--',
                description: '--',
                diagnosis: '--',
                initial: true,
                screenShots: [],
                tempName: '--',
                hospital: '--',
                birthday: '--',
                positive: '--',
                frequency: '--'
            });

            Temp.findOne({'hospital': d.sendHospital}).exec(function (err, temp) {
                if (err) senderror(err);
                else {
                    var newReport = NewReport({
                        examID: mainID,
                        format: temp.format,
                        reportDoc: '--',
                        verifyDoc: '--',
                        initial: true
                    });
                    newReport.save(function (err) {
                        if (err) senderror(err);
                        console.log("new report saved");
                    })
                }
            });

                item.save(function (err) {
                if (err) senderror(err);
               console.log('successfully saved');
            });
            report.save(function (err) {
                if (err) senderror(err);
                console.log('report successfully saved');
            });
        });
        sendJSONresponse(res, 200, {success: true});
    },

    GetNewReport: function (req, res) {
        NewReport.find().exec(function (err, reports) {
            if (err) senderror(err);
            else sendJSONresponse(res, 200, reports);
        })
    },

    GetAllItems: function (req ,res) {
        Item.find().exec(function (err , items) {
            if(err) senderror(err);
            else {
                console.log(userSchema);
                sendJSONresponse(res, 200, items);
            }
        })
    },

    GetAllReports: function (req,res) {
        Report.find().exec(function (err , items) {
            if(err) senderror(err);
            else sendJSONresponse(res, 200, items);
        })
    },

    GetAllApplys: function (req,res) {
        Hero.find().exec(function (err , items) {
            if(err) senderror(err);
            else sendJSONresponse(res, 200, items);
        })
    },

    SendWidgets: function (req, res) {
        var widgets = [
            {
                'name': 'patientID',
                'type': 'String',
                'explanation': '患者的唯一ＩＤ'
            },
            {
                'name': 'examID',
                'type': 'String',
                'explanation': '影像记录的唯一ＩＤ'
            },
            {
                'name': 'name',
                'type': 'String',
                'explanation': '患者在就诊时提供的姓名信息'
            },
            {
                'name': 'gender',
                'type': 'String',
                'explanation': '患者的性别信息'
            },
            {
                'name': 'age',
                'type': 'String',
                'explanation': '患者的年龄信息'
            },
            {
                'name': 'office',
                'type': 'String',
                'explanation': '报告所属部门'
            },
            {
                'name': 'examContent',
                'type': 'String',
                'explanation': '患者的检查信息，包括检查的类型'
            },
            {
                'name': 'examPart',
                'type': 'String',
                'explanation': '患者的检查部位'
            },
            {
                'name': 'date',
                'type': 'String',
                'explanation': '影像的生成日期'
            },
            {
                'name': 'reporttime',
                'type': 'String',
                'explanation': '报告的生成时间'
            },
            {
                'name': 'description',
                'type': 'String',
                'explanation': '报告的影像所见信息'
            },
            {
                'name': 'diagnosis',
                'type': 'String',
                'explanation': '报告的诊断意见'
            },
            {
                'name': 'status',
                'type': 'String',
                'explanation': '报告的诊断状态'
            },
            {
                'name': 'reportDoc',
                'type': 'String',
                'explanation': '影像报告的书写医生'
            },
            {
                'name': 'verifyDoc',
                'type': 'String',
                'explanation': '影像报告的审核医生'
            },
            {
                'name': 'screenShots',
                'type': 'Array',
                'explanation': '报告的所有相关截图信息'
            },
            {
                'name': 'tempName',
                'type': 'String',
                'explanation': '报告所使用的模板名称'
            },
            {
                'name': 'hospital',
                'type': 'String',
                'explanation': '报告的所在医院'
            },
            {
                'name': 'birthday',
                'type': 'String',
                'explanation': '患者的出生日期'
            },
            {
                'name': 'positive',
                'type': 'String',
                'explanation': '检查呈阴性或阳性'
            },
            {
                'name': 'frequency',
                'type': 'String',
                'explanation': '患者的检查次数或第几次检查'
            }
        ];
        sendJSONresponse(res, 200, widgets);
    }
};

module.exports = functions;