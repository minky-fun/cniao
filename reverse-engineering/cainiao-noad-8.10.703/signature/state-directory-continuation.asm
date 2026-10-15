; Native state-directory continuation: real command registration and Darwin syscall/error gateway.

; 0x102a925a8..0x102a925d0
102a925a8: 03008052  mov	w3, #0
102a925ac: 00013fd6  blr	x8
102a925b0: 680240f9  ldr	x8, [x19]
102a925b4: 84f82f10  adr	x4, #0x102af24c4
102a925b8: 1f2003d5  nop
102a925bc: 20008052  mov	w0, #1
102a925c0: c1018052  mov	w1, #0xe
102a925c4: a2008052  mov	w2, #5
102a925c8: 03008052  mov	w3, #0
102a925cc: 00013fd6  blr	x8

; 0x102a2f3e4..0x102a2f400
102a2f3e4: f00306aa  mov	x16, x6
102a2f3e8: 060080d2  mov	x6, #0
102a2f3ec: 070080d2  mov	x7, #0
102a2f3f0: 010000d4  svc	#0
102a2f3f4: 43000054  b.lo	#0x102a2f3fc
102a2f3f8: a0950014  b	#0x102a54a78
102a2f3fc: c0035fd6  ret

; 0x102a54a78..0x102a54a98
102a54a78: f657bda9  stp	x22, x21, [sp, #-0x30]!
102a54a7c: f44f01a9  stp	x20, x19, [sp, #0x10]
102a54a80: fd7b02a9  stp	x29, x30, [sp, #0x20]
102a54a84: fd830091  add	x29, sp, #0x20
102a54a88: f30300aa  mov	x19, x0
102a54a8c: 80008052  mov	w0, #4
102a54a90: 14000094  bl	#0x102a54ae0
102a54a94: f5f401b0  adrp	x21, #0x1068f1000

; 0x102a69ae8..0x102a69b10
102a69ae8: 167146f9  ldr	x22, [x8, #0xce0]
102a69aec: 48f40190  adrp	x8, #0x1068f1000
102a69af0: 083d3a91  add	x8, x8, #0xe8f
102a69af4: e80300f9  str	x8, [sp]
102a69af8: 39670190  adrp	x25, #0x10574d000
102a69afc: 39632491  add	x25, x25, #0x918
102a69b00: e10316aa  mov	x1, x22
102a69b04: e20319aa  mov	x2, x25
102a69b08: 4f1f6794  bl	#0x104431844
102a69b0c: fd031daa  mov	x29, x29
