// Tabel subtitusi untuk kriptografi
const substitutionTable = [...new Set("thequickbrownfoxjumpsoverthelazydog")]; // deklarasi dan menghapus duplikasi
const shift = 5; // melakukan shift kekanan sebanyak 5

// menampilkan preview gambar yang akan dienkripsi atau di dekripsi
function showImagePreview(imageInput, imagePreviewId) {
  const file = imageInput.files[0];
  const imagePreview = document.getElementById(imagePreviewId);

  // cek apakah elemen yang dterima berupa file
  if (file) {
    const reader = new FileReader();

    // tampilkan tag html untuk gambar jika ada gambarnya
    reader.onload = function (event) {
      imagePreview.src = event.target.result;
      imagePreview.style.display = "block";
    };

    reader.readAsDataURL(file);
  } else {
    // jangan tampilkan tag html untuk gambar jika tidak ada gambarnya
    imagePreview.style.display = "none";
  }
}

// Fungsi enkripsi teks dan menanamkannya ka gambar
function encryptAndEmbedMessage(imageInput, messageInput, outputImage) {
  const file = imageInput.files[0]; // menerima file yang dikirim

  // cek agar jika gambar tidak ada setelah menekan tombol enkripsi
  if (!file) {
    alert("Please select an image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      // menghapus konten sebelumnya di tag canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // mencari panjang dan lebar gambar
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // menghitung ukuran pixel gambar
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // mengubah semua karakter teks yang diinputkan menjadi huruf kecil
      const inputText = messageInput.value.toLowerCase();
      let encryptedText = "";

      // perulangan untuk setiap karakter (char) dalam inputText
      for (let char of inputText) {
        encryptedText += /[a-z]/.test(char) // cek apakah karakter dalam perulangan adalah karakter alphabet
          ? substitutionTable[
              (substitutionTable.indexOf(char) + shift) %
                substitutionTable.length
            ] // jika karakter adalah alphabet, maka cari index yang memmiliki karakter yang sama di tabel subtitusi, lalu lakukan shift 5x berdasarkan indeks tabel subtitusi
          : char; // jika bukan alphabet, maka tidak ada perubahan
      }

      // ubah teks enkripsi ke biner
      const binaryMessage = encodeMessageToBinary(encryptedText);

      let messageIndex = 0;

      // perulangan untuk memasukkan teks ke gambar sebanyak jumlah karakter enkripsi
      for (let i = 0; messageIndex < binaryMessage.length; i += 4) {
        // mengganti bit paling tidak signifikan (LSB) dari warna piksel saat ini dengan
        pixels[i] =
          (pixels[i] & 0xfe) | parseInt(binaryMessage[messageIndex++]);
      }

      ctx.putImageData(imageData, 0, 0); // menyimpan data gambar setelah perulangan selesai dan pesan telah disisipkan ke kanvas
      outputImage.src = canvas.toDataURL(); // mengubah kanvas menjadi url gambar, lalu memasukan nya ke tag html img
      outputImage.classList.remove("d-none");
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

// Ekstaksi data enkripsi dari gambar yang dikirm
function extractAndDecryptMessage(imageInput, decryptedMessage) {
  const file = imageInput.files[0];

  if (!file) {
    alert("Please select an image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      // mengambil data yang ada di kanva
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      // menghitung panjang dan lebar gambar
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let binaryMessage = "";
      for (let i = 0; i < pixels.length; i += 4) {
        binaryMessage += (pixels[i] & 0x01).toString();
      }

      const encryptedMessage = decodeBinaryToMessage(binaryMessage);
      let decryptedText = "";

      for (let char of encryptedMessage.toLowerCase()) {
        decryptedText += /[a-z]/.test(char)
          ? // jika karakater yang disisipkan adalah alphabet, maka lakukan shift
            substitutionTable[
              (substitutionTable.indexOf(char) -
                shift +
                substitutionTable.length) %
                substitutionTable.length
            ]
          : // jika bukan alphabet maka tidak perlu melakukan shitt (spasi atau angka)
            char;
      }

      decryptedMessage.value = decryptedText;
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

// fungsi mengubah pesan menjadi biner
function encodeMessageToBinary(message) {
  let binaryMessage = "";
  message += "\0";
  for (let i = 0; i < message.length; i++) {
    const binaryChar = message.charCodeAt(i).toString(2).padStart(8, "0");
    binaryMessage += binaryChar;
  }
  return binaryMessage;
}

// fungsi mengubah biner menjadi pesan sebenarnya
function decodeBinaryToMessage(binaryMessage) {
  let message = "";
  for (let i = 0; i < binaryMessage.length; i += 8) {
    const byte = binaryMessage.substring(i, i + 8);
    const char = String.fromCharCode(parseInt(byte, 2));
    if (char === "\0") break;
    message += char;
  }
  return message;
}

document.addEventListener("DOMContentLoaded", () => {
  // deklasrasi tombol enkripsi dan tombol dekripsi
  const encryptButton = document.getElementById("encryptButton");
  const decryptButton = document.getElementById("decryptButton");

  const imageInput = document.getElementById("imageInput");
  const imageInputDecrypt = document.getElementById("imageInputDecrypt");

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      showImagePreview(imageInput, "imagePreview"); // menampikan gambar jika telah diunggah (halaman enkripsi)
    });
  }

  if (imageInputDecrypt) {
    imageInputDecrypt.addEventListener("change", () => {
      showImagePreview(imageInputDecrypt, "imagePreviewDecrypt"); // menampikan gambar jika telah diunggah (halaman dekripsi)
    });
  }

  // menjalakan fungsi enkripsi jika tombol enkripsi di tekan
  if (encryptButton) {
    encryptButton.addEventListener("click", () => {
      const encryptMessage = document.getElementById("encryptMessage"); // mengirimkan pesan dari input teks
      const outputImage = document.getElementById("outputImage"); // mengirimkan gambar dari input file
      if (encryptMessage && imageInput && outputImage) {
        encryptAndEmbedMessage(imageInput, encryptMessage, outputImage);
      }
    });
  }

  // menjalakan fungsi dekripsi jika tombol dekripsi di tekan
  if (decryptButton) {
    decryptButton.addEventListener("click", () => {
      const decryptedMessage = document.getElementById("decryptedMessage"); // mengirimkan gambar dari input file
      if (imageInputDecrypt && decryptedMessage) {
        extractAndDecryptMessage(imageInputDecrypt, decryptedMessage);
      }
    });
  }
});
