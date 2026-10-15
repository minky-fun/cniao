
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a67260: aa1803e0    	mov	x0, x24
102a67264: aa1b03e1    	mov	x1, x27
102a67268: 9401870e    	bl	0x102ac8ea0 <_CMa03SUie28mjv+0x63a68>
102a6726c: aa0003fa    	mov	x26, x0
102a67270: d001f441    	adrp	x1, 0x1068f1000 <dyld_stub_binder+0x1068f1000>
102a67274: 91342821    	add	x1, x1, #0xd0a
102a67278: 52800002    	mov	w2, #0x0                ; =0
102a6727c: 94018b9d    	bl	0x102aca0f0 <_CMa03SUie28mjv+0x64cb8>
102a67280: aa0003f4    	mov	x20, x0
102a67284: aa1a03e0    	mov	x0, x26
102a67288: d001f441    	adrp	x1, 0x1068f1000 <dyld_stub_binder+0x1068f1000>
102a6728c: 9133fc21    	add	x1, x1, #0xcff
102a67290: 52800002    	mov	w2, #0x0                ; =0
102a67294: 94018b97    	bl	0x102aca0f0 <_CMa03SUie28mjv+0x64cb8>
102a67298: aa0003fc    	mov	x28, x0
102a6729c: aa1a03e0    	mov	x0, x26
102a672a0: d001f441    	adrp	x1, 0x1068f1000 <dyld_stub_binder+0x1068f1000>
102a672a4: 9133d421    	add	x1, x1, #0xcf5
102a672a8: 52800002    	mov	w2, #0x0                ; =0
102a672ac: 94018b91    	bl	0x102aca0f0 <_CMa03SUie28mjv+0x64cb8>
102a672b0: b90013e0    	str	w0, [sp, #0x10]
102a672b4: 52800500    	mov	w0, #0x28               ; =40
102a672b8: 9467283a    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102a672bc: aa0003fa    	mov	x26, x0
102a672c0: b4000080    	cbz	x0, 0x102a672d0 <_CMa03SUie28mjv+0x1e98>
102a672c4: f900135f    	str	xzr, [x26, #0x20]
102a672c8: 4f00e400    	movi.16b	v0, #0x0
102a672cc: ad000340    	stp	q0, q0, [x26]
102a672d0: b900035c    	str	w28, [x26]
102a672d4: b9001754    	str	w20, [x26, #0x14]
102a672d8: b4000093    	cbz	x19, 0x102a672e8 <_CMa03SUie28mjv+0x1eb0>
102a672dc: aa1303e0    	mov	x0, x19
102a672e0: 94672ba2    	bl	0x104432168 <dyld_stub_binder+0x104432168>
102a672e4: 14000002    	b	0x102a672ec <_CMa03SUie28mjv+0x1eb4>
102a672e8: d2800000    	mov	x0, #0x0                ; =0
102a672ec: f9000740    	str	x0, [x26, #0x8]
102a672f0: b9401fe8    	ldr	w8, [sp, #0x1c]
102a672f4: b9000748    	str	w8, [x26, #0x4]
102a672f8: b9401be8    	ldr	w8, [sp, #0x18]
102a672fc: b9001348    	str	w8, [x26, #0x10]
102a67300: b94013e8    	ldr	w8, [sp, #0x10]
102a67304: b9001b48    	str	w8, [x26, #0x18]
102a67308: f94007e8    	ldr	x8, [sp, #0x8]
102a6730c: f9001348    	str	x8, [x26, #0x20]
102a67310: aa1a03e0    	mov	x0, x26
102a67314: 9401613c    	bl	0x102abf804 <_CMa03SUie28mjv+0x5a3cc>
