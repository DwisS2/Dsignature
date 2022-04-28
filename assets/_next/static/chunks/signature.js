$(function () {
  // init signaturepad
  var signaturePad = new SignaturePad(
    document.getElementById('signature-pad'),
    {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)'
    }
  )

  // get image data and put to hidden input field
  function getSignaturePad () {
    var imageData = signaturePad.toDataURL('image/png')

    $('#signature-result').val(imageData)

    $('#signature-img-result').attr('src', 'data:' + imageData)
  }

  // form action
  $('#form-submit').submit(function () {
    getSignaturePad()
    return true // set true to submits the form.
  })

  // action on click button clea
  $('#clear').click(function (e) {
    e.preventDefault()
    signaturePad.clear()
  })
})
