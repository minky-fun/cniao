
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a653a4 <_CMa03Q0IM8B3Ic>:
102a653a4: 34000481    	cbz	w1, 0x102a65434 <_CMa03Q0IM8B3Ic+0x90>
102a653a8: 370000a1    	tbnz	w1, #0x0, 0x102a653bc <_CMa03Q0IM8B3Ic+0x18>
102a653ac: aa1f03e8    	mov	x8, xzr
102a653b0: 7100043f    	cmp	w1, #0x1
102a653b4: 54000141    	b.ne	0x102a653dc <_CMa03Q0IM8B3Ic+0x38>
102a653b8: 1400001f    	b	0x102a65434 <_CMa03Q0IM8B3Ic+0x90>
102a653bc: 39400048    	ldrb	w8, [x2]
102a653c0: 39400069    	ldrb	w9, [x3]
102a653c4: 4b050108    	sub	w8, w8, w5
102a653c8: 4a080128    	eor	w8, w9, w8
102a653cc: 39000008    	strb	w8, [x0]
102a653d0: 52800028    	mov	w8, #0x1                ; =1
102a653d4: 7100043f    	cmp	w1, #0x1
102a653d8: 540002e0    	b.eq	0x102a65434 <_CMa03Q0IM8B3Ic+0x90>
102a653dc: 2a0103e9    	mov	w9, w1
102a653e0: 9100044a    	add	x10, x2, #0x1
102a653e4: 8b08014b    	add	x11, x10, x8
102a653e8: 1ac4090c    	udiv	w12, w8, w4
102a653ec: 385ff16e    	ldurb	w14, [x11, #-0x1]
102a653f0: 1b04a18c    	msub	w12, w12, w4, w8
102a653f4: 386c486c    	ldrb	w12, [x3, w12, uxtw]
102a653f8: 1100050d    	add	w13, w8, #0x1
102a653fc: 4b0501ce    	sub	w14, w14, w5
102a65400: 1ac409af    	udiv	w15, w13, w4
102a65404: 4a0e018c    	eor	w12, w12, w14
102a65408: 8b08000e    	add	x14, x0, x8
102a6540c: 390001cc    	strb	w12, [x14]
102a65410: 1b04b5ed    	msub	w13, w15, w4, w13
102a65414: 3940016b    	ldrb	w11, [x11]
102a65418: 386d486c    	ldrb	w12, [x3, w13, uxtw]
102a6541c: 91000908    	add	x8, x8, #0x2
102a65420: 6b08013f    	cmp	w9, w8
102a65424: 4b05016b    	sub	w11, w11, w5
102a65428: 4a0b018b    	eor	w11, w12, w11
102a6542c: 390005cb    	strb	w11, [x14, #0x1]
102a65430: 54fffda1    	b.ne	0x102a653e4 <_CMa03Q0IM8B3Ic+0x40>
102a65434: d65f03c0    	ret

0000000102a65438 <_CMa03SUie28mjv>:
102a65438: 34000481    	cbz	w1, 0x102a654c8 <_CMa03SUie28mjv+0x90>
102a6543c: 370000a1    	tbnz	w1, #0x0, 0x102a65450 <_CMa03SUie28mjv+0x18>
102a65440: aa1f03e8    	mov	x8, xzr
102a65444: 7100043f    	cmp	w1, #0x1
102a65448: 54000141    	b.ne	0x102a65470 <_CMa03SUie28mjv+0x38>
102a6544c: 1400001f    	b	0x102a654c8 <_CMa03SUie28mjv+0x90>
102a65450: 39400048    	ldrb	w8, [x2]
102a65454: 39400069    	ldrb	w9, [x3]
102a65458: 4a050108    	eor	w8, w8, w5
102a6545c: 4b090108    	sub	w8, w8, w9
102a65460: 39000008    	strb	w8, [x0]
102a65464: 52800028    	mov	w8, #0x1                ; =1
102a65468: 7100043f    	cmp	w1, #0x1
102a6546c: 540002e0    	b.eq	0x102a654c8 <_CMa03SUie28mjv+0x90>
102a65470: 2a0103e9    	mov	w9, w1
102a65474: 9100044a    	add	x10, x2, #0x1
102a65478: 8b08014b    	add	x11, x10, x8
102a6547c: 1ac4090c    	udiv	w12, w8, w4
102a65480: 385ff16e    	ldurb	w14, [x11, #-0x1]
102a65484: 1b04a18c    	msub	w12, w12, w4, w8
102a65488: 386c486c    	ldrb	w12, [x3, w12, uxtw]
102a6548c: 1100050d    	add	w13, w8, #0x1
102a65490: 4a0501ce    	eor	w14, w14, w5
102a65494: 1ac409af    	udiv	w15, w13, w4
102a65498: 4b0c01cc    	sub	w12, w14, w12
102a6549c: 8b08000e    	add	x14, x0, x8
102a654a0: 390001cc    	strb	w12, [x14]
102a654a4: 1b04b5ed    	msub	w13, w15, w4, w13
102a654a8: 3940016b    	ldrb	w11, [x11]
102a654ac: 386d486c    	ldrb	w12, [x3, w13, uxtw]
102a654b0: 91000908    	add	x8, x8, #0x2
102a654b4: 6b08013f    	cmp	w9, w8
102a654b8: 4a05016b    	eor	w11, w11, w5
102a654bc: 4b0c016b    	sub	w11, w11, w12
102a654c0: 390005cb    	strb	w11, [x14, #0x1]
102a654c4: 54fffda1    	b.ne	0x102a65478 <_CMa03SUie28mjv+0x40>
102a654c8: d65f03c0    	ret
