onmessage = function (e) {
  const chineseWord = e.data["CHỮ HÁN"];
  const url = `https://api.hanzii.net/api/search/vi/${chineseWord}?type=word&page=1&limit=50`;
  this.fetch(url)
    .then((response) => response.json())
    .then((responseJson) => {
      const results = responseJson["result"];
      const result = results.find((r) => r["word"] === chineseWord);
      if (result) {
        e.data["PHIÊN ÂM"] = `/${result["pinyin"]}/`;
        e.data["HÁN VIỆT"] = `${result["cn_vi"]}`.toUpperCase();
        e.data["NGHĨA"] = result["content"][0]["means"][0]["mean"];
        e.data["success"] = true;
      } else {
        e.data["success"] = false;
      }
      postMessage(e.data);
    });
};
