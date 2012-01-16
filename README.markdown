FileStreamer
============

Use FileStreamer when you need to work on sequential slices of a file with the
[HTML5 File API](http://www.w3.org/TR/FileAPI/). By working on slices, you can
work on a large file without loading the entire file into memory at once.

Example
-------
Here is a contrived example of calculating the length of a file:

    var someFile = document.getElementById('fileInput').files[0];

    var fileLength = 0;
    var myWorkFunc = function (event, eof) {
      binaryString = event.target.result;
      fileLength += binaryString.length;

      if (eof) {
        alert('The length of this file in bytes is: ' + fileLength);
      }
    }

    var fs = new FileStreamer(4 * 1024 * 1024);
    fs.streamAsBinaryString(someFile, myWorkFunc);

This is a contrived example since you could just use `someFile.size`, but it
demonstrates the basic usage.

Usage
-----
To construct a FileStreamer, specify the desired slice size in bytes. For
example:

    var fs = new FileStreamer(4 * 1024 * 1024); // 4MB slice size

Since the File API is relatively new and implementations vary across
browsers, I can't tell you what slice size to use. Large slice sizes will
need more memory, while smaller slice sizes will use more CPU.

## Stream functions
The available stream functions correspond to each of the read functions in
the FileReader API (https://developer.mozilla.org/en/DOM/FileReader). Each
function accepts the same arguments as its corresponding FileReader function,
with the addition of a callback.

  - streamAsArrayBuffer(file, callback)
  - streamAsBinaryString(file, callback)
  - streamAsDataURL(file, callback)
  - streamAsText(file, encoding, callback)

## Work function
The work function (callback) receives two arguments:

  1. event: the ProgressEvent from FileReader.onloadend.
  2. eof: true if this is the last slice in the file, otherwise false.

The callback is guaranteed to be called sequentially for each file slice. If
the callback returns false, streaming will stop. Otherwise, streaming will
continue to the next slice.

