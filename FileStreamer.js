/*
 * Copyright (c) 2012, Rohan Singh (rohan@washington.edu)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

/*
 * Use FileStreamer when you need to work on sequential slices of a file with the
 * HTML5 File API (http://www.w3.org/TR/FileAPI/). By working on slices, you can
 * work on a large file without loading the entire file into memory at once.
 *
 * Here is a contrived example of calculating the length of a file:
 *
 *   var someFile = document.getElementById('fileInput').files[0];
 *
 *   var fileLength = 0;
 *   var myWorkFunc = function (event, eof) {
 *     binaryString = event.target.result;
 *     fileLength += binaryString.length;
 *
 *     if (eof) {
 *       alert('The length of this file in bytes is: ' + fileLength);
 *     }
 *   }
 *
 *   var fs = new FileStreamer(4 * 1024 * 1024);
 *   fs.streamAsBinaryString(someFile, myWorkFunc);
 * 
 * This is a contrived example since you could just use `someFile.size`, but it
 * demonstrates the basic usage.
 *
 * To construct a FileStreamer, specify the desired slice size in bytes. For
 * example:
 *
 *   var fs = new FileStreamer(4 * 1024 * 1024); // 4MB slice size
 *
 * Since the File API is relatively new and implementations vary across
 * browsers, I can't tell you what slice size to use. Large slice sizes will
 * need more memory, while smaller slice sizes will use more CPU.
 *
 * The available stream functions correspond to each of the read functions in
 * the FileReader API (https://developer.mozilla.org/en/DOM/FileReader). Each
 * function accepts the same arguments as its corresponding FileReader function,
 * with the addition of a callback.
 *
 *   - streamAsArrayBuffer(file, callback)
 *   - streamAsBinaryString(file, callback)
 *   - streamAsDataURL(file, callback)
 *   - streamAsText(file, encoding, callback)
 *
 * The work function (callback) receives two arguments:
 *
 *   1. event: the ProgressEvent from FileReader.onloadend.
 *   2. eof: true if this is the last slice in the file, otherwise false.
 * 
 * The callback is guaranteed to be called sequentially for each file slice. If
 * the callback returns false, streaming will stop. Otherwise, streaming will
 * continue to the next slice.
 *
 */

var FileStreamer = function (sliceSize) {
  this.sliceSize = sliceSize;
}

FileStreamer.prototype.streamAsBinaryString = function (file, callback) {
  return this.streamFile(file, callback);
}

FileStreamer.prototype.streamAsText = function (file, encoding, callback) {
  return this.streamFile(file, callback, 'text', encoding);
}

FileStreamer.prototype.streamAsArrayBuffer = function (file, callback) {
  return this.streamFile(file, callback, 'buffer');
}

FileStreamer.prototype.streamAsDataURL = function (file, callback) {
  return this.streamFile(file, callback, 'url');
}

FileStreamer.prototype.streamFile = function (file, callback, readType, encoding) {
  var fileReader = new FileReader();
  var position = 0;
  var eof = false;

  var sliceFunc = (file.webkitSlice) ? file.webkitSlice : file.mozSlice;
  
  var readFunc;
  if (readType === 'text') {
    readFunc = function (blob) {
      return fileReader.readAsText.apply(this, [blob, encoding]);
    }
  }
  else if (readType === 'buffer') {
    readFunc = fileReader.readAsArrayBuffer;
  }
  else if (readType === 'url') {
    readFunc = fileReader.readAsDataURL;
  }
  else {
    readFunc = fileReader.readAsBinaryString;
  }

  var that = this;
  var doRead = function () {
    if (eof) {
      // We've read the entire file.
      return;
    }

    var end = position + that.sliceSize;
    if (end >= file.size) {
      end = file.size;
      eof = true;
    }

    var blob = sliceFunc.apply(file, [position, end]);
    position = end;

    readFunc.apply(fileReader, [blob]);
  };

  fileReader.onloadend = function (event) {
    if (callback.apply(file, [event, eof]) !== false) {
      doRead();
    }
  };

  doRead();
}

