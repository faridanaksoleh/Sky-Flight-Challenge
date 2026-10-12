// @ts-nocheck
// Cara memegang micro:bit:
// - Kotak 25 LED dan tombol A/B menghadap ATAS.
// - Kabel USB mengarah ke DEPAN (menjauhi badan).
// - Miring ke kanan = belok kanan, angkat ujung USB = naik.
// Program ini mengirim "roll,pitch" (derajat) lewat USB 50 kali per detik.
serial.redirectToUSB()
serial.setBaudRate(BaudRate.BaudRate115200)
basic.forever(function () {
    serial.writeLine("" + input.rotation(Rotation.Roll) + "," + input.rotation(Rotation.Pitch))
    basic.pause(20)
})
