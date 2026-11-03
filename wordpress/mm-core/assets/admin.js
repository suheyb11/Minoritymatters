// The "Choose image" and "Add photos" buttons in the Details box and on the Site settings page.
// They open the WordPress Media Library; the chosen image's address is put in the text box.
jQuery(function ($) {
  $(document).on("click", ".mm-choose-image", function (e) {
    e.preventDefault();
    var box = $(this).closest(".mm-image");
    var frame = wp.media({ title: "Choose image", button: { text: "Use this image" }, multiple: false, library: { type: "image" } });
    frame.on("select", function () {
      var image = frame.state().get("selection").first().toJSON();
      box.find(".mm-image-input").val(image.url);
      box.find(".mm-image-preview").html($("<img alt=''>").attr("src", image.url));
    });
    frame.open();
  });

  // Each chosen photo is added on a new line: "address | description" (the description is the image's Alt text)
  $(document).on("click", ".mm-add-photos", function (e) {
    e.preventDefault();
    var textarea = $(this).closest("td").find(".mm-gallery-input");
    var frame = wp.media({ title: "Add photos", button: { text: "Add to gallery" }, multiple: "add", library: { type: "image" } });
    frame.on("select", function () {
      var lines = frame.state().get("selection").map(function (attachment) {
        var image = attachment.toJSON();
        return image.alt ? image.url + " | " + image.alt : image.url;
      });
      var current = textarea.val().replace(/\s+$/, "");
      textarea.val((current ? current + "\n" : "") + lines.join("\n"));
    });
    frame.open();
  });

  // Live preview when an address is typed by hand
  $(document).on("change", ".mm-image-input", function () {
    var value = $(this).val().trim();
    var preview = $(this).closest(".mm-image").find(".mm-image-preview");
    preview.html(value && /^https?:\/\//.test(value) ? $("<img alt=''>").attr("src", value) : "");
  });
});
