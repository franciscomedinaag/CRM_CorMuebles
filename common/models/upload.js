'use strict';

const uuidV4 = require('uuid/v4');

module.exports = function(Upload) {
    
    /**
     * uploads a new base 64 file to the server
     * @param {string} newFile new file in base 64 encoding object
     * @param {string} newFileName new file's name
     * @param {Function(Error, string)} callback
     */

    Upload.newBase64File = function(newFile, callback) {
        const encodedFileContainer = newFile.encodedFileContainer;
        var UploadedFiles = Upload.app.models.UploadedFiles;
        const encodedFile = newFile.base64File;
        var newFileId = uuidV4();
        var fileName = newFileId+newFile.fileExtention;
        // TODO
        var uploadStream = Upload.uploadStream(
            encodedFileContainer,
            fileName
        );
        uploadStream.end(encodedFile, 'base64', async err => {
            if (err) return callback(err);
            UploadedFiles.create({
                id: newFileId,
                URL: "/Uploads/"+encodedFileContainer+"/download/"+fileName
            }, function(err, res){
                if (err) return callback(err);
                callback(null, res);
            })
        });
    }

    Upload.replaceFileBase64File = function(oldFileId, newFile, callback){
        var UploadedFiles = Upload.app.models.UploadedFiles;

        if(oldFileId == null){
            // upload and create new file
            Upload.newBase64File(newFile, function(err, res){
                if (err) return callback(err);

                callback(null, res)
            })
        }
        else{
            // serach old file
            UploadedFiles.findById(oldFileId, function(err, oldFile){
                if (err) return callback(err);
    
                // destroy old File
                UploadedFiles.destroyById(oldFileId,function(err){
                    if (err) return callback(err);
        
                    // destroy old file
                    var container = oldFile.URL.split("/")[2];
                    var oldFileName = oldFile.URL.split("/")[4];
                    Upload.removeFile(container, oldFileName, function(err){
                        if (err) return callback(err);
    
                        // upload and create new file
                        Upload.newBase64File(newFile, function(err, res){
                            if (err) return callback(err);
            
                            callback(null, res)
                        })
                    })
                });
            });
        }
    }
};