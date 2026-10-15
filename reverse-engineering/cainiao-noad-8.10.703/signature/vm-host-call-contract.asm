; Selected verified instructions only; omitted intervals include obfuscation data.
; Descriptor+8: target; +17: ABI flag; +36: result dispatch selector.
; Selector table 0..5: dec8, e00c, de8c, deac, de70, de70 (base 0x102a40000).
; Selector 0 uses a further marshalling path, not yet ported.
0x102a4dd90 ldr x9, [x8]
0x102a4dd94 cbz x9, #0x102a4de10
0x102a4dd98 ldr x10, [x26, #8]
0x102a4dd9c cbz x10, #0x102a4de0c
0x102a4dddc sxtw x9, w11
0x102a4dde0 mov w11, #0x75
0x102a4dde4 eor x9, x9, x11
0x102a4dde8 mov w11, #0x28
0x102a4ddec madd x9, x9, x11, x26
0x102a4ddf0 ldrb w9, [x9, #0x11]
0x102a4ddf4 cbz w9, #0x102a4de4c
0x102a4ddf8 mov x0, x8
0x102a4ddfc mov x1, x19
0x102a4de00 blr x10
0x102a4de04 mov w0, #0
0x102a4de08 b #0x102a4de10
0x102a4de0c mov w0, #7
0x102a4de4c ldr w8, [x26, #0x24]
0x102a4de50 cmp w8, #5
0x102a4de54 b.hi #0x102a4e020
0x102a4de58 adrp x9, #0x10481f000
0x102a4de5c add x9, x9, #0x212
0x102a4de60 adr x11, #0x102a4de70
0x102a4de64 ldrb w12, [x9, x8]
0x102a4de68 add x11, x11, x12, lsl #2
0x102a4de6c br x11
0x102a4de70 ldp x0, x1, [x19, #0x78]
0x102a4de74 ldp x2, x3, [x19, #0x88]
0x102a4de78 ldp x4, x5, [x19, #0x98]
0x102a4de7c blr x10
0x102a4de80 mov w0, #0
0x102a4de84 str d0, [x19, #0x138]
0x102a4de88 b #0x102a4de10
0x102a4de8c ldp x0, x1, [x19, #0x78]
0x102a4de90 ldp x2, x3, [x19, #0x88]
0x102a4de94 ldp x4, x5, [x19, #0x98]
0x102a4de98 blr x10
0x102a4de9c mov x8, x0
0x102a4dea0 mov w0, #0
0x102a4dea4 str x8, [x19, #0x78]
0x102a4dea8 b #0x102a4de10
0x102a4deac ldp x0, x1, [x19, #0x78]
0x102a4deb0 ldp x2, x3, [x19, #0x88]
0x102a4deb4 ldp x4, x5, [x19, #0x98]
0x102a4deb8 blr x10
0x102a4debc mov w0, #0
0x102a4dec0 str s0, [x19, #0x138]
0x102a4dec4 b #0x102a4de10
0x102a4e00c ldp x0, x1, [x19, #0x78]
0x102a4e010 ldp x2, x3, [x19, #0x88]
0x102a4e014 ldp x4, x5, [x19, #0x98]
0x102a4e018 blr x10
0x102a4e01c b #0x102a4de04
0x102a4e020 mov w0, #0x16
0x102a4e024 b #0x102a4de10
