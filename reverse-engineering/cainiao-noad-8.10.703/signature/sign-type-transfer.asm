
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ab58c4: d100c3ff    	sub	sp, sp, #0x30
102ab58c8: a9014ff4    	stp	x20, x19, [sp, #0x10]
102ab58cc: a9027bfd    	stp	x29, x30, [sp, #0x20]
102ab58d0: 910083fd    	add	x29, sp, #0x20
102ab58d4: aa0203f3    	mov	x19, x2
102ab58d8: 528014c8    	mov	w8, #0xa6               ; =166
102ab58dc: b9000be8    	str	w8, [sp, #0x8]
102ab58e0: 910033e8    	add	x8, sp, #0xc
102ab58e4: 910023e9    	add	x9, sp, #0x8
102ab58e8: 10000023    	adr	x3, 0x102ab58ec <_CMa03SUie28mjv+0x504b4>
102ab58ec: 9800012b    	ldrsw	x11, 0x102ab5910 <_CMa03SUie28mjv+0x504d8>
102ab58f0: aa2b03eb    	mvn	x11, x11
102ab58f4: d103c16b    	sub	x11, x11, #0xf0
102ab58f8: b9800120    	ldrsw	x0, [x9]
102ab58fc: 8b00016b    	add	x11, x11, x0
102ab5900: 8b0b0063    	add	x3, x3, x11
102ab5904: 52800f4d    	mov	w13, #0x7a              ; =122
102ab5908: b900010d    	str	w13, [x8]
102ab590c: d61f0060    	br	x3
102ab5910: ffffff7d    	<unknown>
102ab5914: f9892336    	prfm	pstslckeep, [x25, #0x1240]
102ab5918: 92a860e6    	mov	x6, #-0x43070001        ; =-1124532225
102ab591c: a506ab12    	ld1sh	{ z18.d }, p2/z, [x24, #0x6, mul vl]
102ab5920: 1f9c0c34    	<unknown>
102ab5924: b9400fe8    	ldr	w8, [sp, #0xc]
102ab5928: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab592c: 39502289    	ldrb	w9, [x20, #0x408]
102ab5930: 71002d1f    	cmp	w8, #0xb
102ab5934: 7a402924    	ccmp	w9, #0x0, #0x4, hs
102ab5938: 540001a1    	b.ne	0x102ab596c <_CMa03SUie28mjv+0x50534>
102ab593c: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5940: 91104000    	add	x0, x0, #0x410
102ab5944: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5948: 912fe042    	add	x2, x2, #0xbf8
102ab594c: d000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5950: 91316063    	add	x3, x3, #0xc58
102ab5954: 52800c01    	mov	w1, #0x60               ; =96
102ab5958: 52800064    	mov	w4, #0x3                ; =3
102ab595c: 528005e5    	mov	w5, #0x2f               ; =47
102ab5960: 9465e11c    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab5964: 52800028    	mov	w8, #0x1                ; =1
102ab5968: 39102288    	strb	w8, [x20, #0x408]
102ab596c: f1002e7f    	cmp	x19, #0xb
102ab5970: 540000a8    	b.hi	0x102ab5984 <_CMa03SUie28mjv+0x5054c>
102ab5974: f001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5978: 91104108    	add	x8, x8, #0x410
102ab597c: f8737900    	ldr	x0, [x8, x19, lsl #3]
102ab5980: 14000002    	b	0x102ab5988 <_CMa03SUie28mjv+0x50550>
102ab5984: 528002e0    	mov	w0, #0x17               ; =23
102ab5988: a9427bfd    	ldp	x29, x30, [sp, #0x20]
102ab598c: a9414ff4    	ldp	x20, x19, [sp, #0x10]
102ab5990: 9100c3ff    	add	sp, sp, #0x30
102ab5994: d65f03c0    	ret
