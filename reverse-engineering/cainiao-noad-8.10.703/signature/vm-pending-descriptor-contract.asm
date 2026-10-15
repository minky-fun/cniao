; Verified guard and pending-descriptor accesses; no obfuscation data included.
0x102a53b74 cbz x0, #0x102a53b8c
0x102a53b78 cbz x1, #0x102a53b8c
0x102a53b7c ldr x8, [x0]
0x102a53b80 cbz x8, #0x102a53b8c
0x102a53b84 ldr w8, [x8, #0x18]
0x102a53b88 cbz w8, #0x102a53b90
0x102a53b8c ret
0x102a53b90 ldr x8, [x1, #0x78]
0x102a53b94 cbz x8, #0x102a53b8c
0x102a53b98 str x8, [x1, #0x10]
0x102a53b9c ret
0x102a4dd74 cbz x0, #0x102a4de0c
0x102a4dd78 mov x26, x2
0x102a4dd7c mov x8, x0
0x102a4dd80 mov w0, #7
0x102a4dd84 cbz x2, #0x102a4de10
0x102a4dd88 mov x19, x1
0x102a4dd8c cbz x1, #0x102a4de10
0x102a4dd90 ldr x9, [x8]
0x102a4dd94 cbz x9, #0x102a4de10
0x102a4dd98 ldr x10, [x26, #8]
0x102a4dd9c cbz x10, #0x102a4de0c
