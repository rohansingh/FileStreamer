Sha1File = {
  getSha1Hash: function (file, callback) {
    var head = naked_sha1_head();

    var fs = new FileStreamer(4 * 1024 * 1024);
    fs.streamAsBinaryString(file, function (data, eof) {
      var buffer = str2binb(data);

      naked_sha1(buffer, data.length * 8, head);

      if (eof) {
        var hash = binb2hex(naked_sha1_tail(head));
        callback(hash);
      }
    });
  }
};

