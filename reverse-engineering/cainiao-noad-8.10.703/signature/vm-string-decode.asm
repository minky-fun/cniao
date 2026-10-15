
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a51458 <_uP0zKbWVU9>:
102a5da7c: f9408428    	ldr	x8, [x1, #0x108]
102a5da80: b4000328    	cbz	x8, 0x102a5dae4 <_uP0zKbWVU9+0xc68c>
102a5da84: b941102b    	ldr	w11, [x1, #0x110]
102a5da88: 340002eb    	cbz	w11, 0x102a5dae4 <_uP0zKbWVU9+0xc68c>
102a5da8c: 52800009    	mov	w9, #0x0                ; =0
102a5da90: f940000a    	ldr	x10, [x0]
102a5da94: f9400d4a    	ldr	x10, [x10, #0x18]
102a5da98: b940090c    	ldr	w12, [x8, #0x8]
102a5da9c: 340001cc    	cbz	w12, 0x102a5dad4 <_uP0zKbWVU9+0xc67c>
102a5daa0: d280000b    	mov	x11, #0x0               ; =0
102a5daa4: b940050c    	ldr	w12, [x8, #0x4]
102a5daa8: 8b0c014c    	add	x12, x10, x12
102a5daac: 3940310d    	ldrb	w13, [x8, #0xc]
102a5dab0: 386b698e    	ldrb	w14, [x12, x11]
102a5dab4: 4a0d01ce    	eor	w14, w14, w13
102a5dab8: 382b698e    	strb	w14, [x12, x11]
102a5dabc: 11014dad    	add	w13, w13, #0x53
102a5dac0: b940090e    	ldr	w14, [x8, #0x8]
102a5dac4: 9100056b    	add	x11, x11, #0x1
102a5dac8: 6b0e017f    	cmp	w11, w14
102a5dacc: 54ffff23    	b.lo	0x102a5dab0 <_uP0zKbWVU9+0xc658>
102a5dad0: b941102b    	ldr	w11, [x1, #0x110]
102a5dad4: 11000529    	add	w9, w9, #0x1
102a5dad8: 9100b108    	add	x8, x8, #0x2c
102a5dadc: 6b0b013f    	cmp	w9, w11
102a5dae0: 54fffdc3    	b.lo	0x102a5da98 <_uP0zKbWVU9+0xc640>
102a5dae4: d65f03c0    	ret
