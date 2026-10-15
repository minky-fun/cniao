
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa9658: d10143ff    	sub	sp, sp, #0x50
102aa965c: a9015ff8    	stp	x24, x23, [sp, #0x10]
102aa9660: a90257f6    	stp	x22, x21, [sp, #0x20]
102aa9664: a9034ff4    	stp	x20, x19, [sp, #0x30]
102aa9668: a9047bfd    	stp	x29, x30, [sp, #0x40]
102aa966c: 910103fd    	add	x29, sp, #0x40
102aa9670: aa0403f3    	mov	x19, x4
102aa9674: aa0203f5    	mov	x21, x2
102aa9678: aa0103f6    	mov	x22, x1
102aa967c: aa0003f7    	mov	x23, x0
102aa9680: 52800308    	mov	w8, #0x18               ; =24
102aa9684: b9000be8    	str	w8, [sp, #0x8]
102aa9688: 910033e8    	add	x8, sp, #0xc
102aa968c: 910023e9    	add	x9, sp, #0x8
102aa9690: d001f26b    	adrp	x11, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa9694: 913a816b    	add	x11, x11, #0xea0
102aa9698: 1000002a    	adr	x10, 0x102aa969c <_CMa03SUie28mjv+0x44264>
102aa969c: 9800012f    	ldrsw	x15, 0x102aa96c0 <_CMa03SUie28mjv+0x44288>
102aa96a0: d2800fac    	mov	x12, #0x7d              ; =125
102aa96a4: ca0c01ef    	eor	x15, x15, x12
102aa96a8: b9800134    	ldrsw	x20, [x9]
102aa96ac: 8b1401ef    	add	x15, x15, x20
102aa96b0: 8b0f014a    	add	x10, x10, x15
102aa96b4: 528004c0    	mov	w0, #0x26               ; =38
102aa96b8: b9000100    	str	w0, [x8]
102aa96bc: d61f0140    	br	x10
102aa96c0: 0000005d    	udf	#0x5d
102aa96c4: 53efaea5    	<unknown>
102aa96c8: 9a566907    	<unknown>
102aa96cc: 1fba7343    	<unknown>
102aa96d0: 91219d05    	add	x5, x8, #0x867
102aa96d4: d001f268    	adrp	x8, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa96d8: 913aa108    	add	x8, x8, #0xea8
102aa96dc: 7100007f    	cmp	w3, #0x0
102aa96e0: 9a880168    	csel	x8, x11, x8, eq
102aa96e4: f9400114    	ldr	x20, [x8]
102aa96e8: b001ded8    	adrp	x24, 0x106682000 <_OBJC_EHTYPE_$_NSError+0x15ebd0>
102aa96ec: 910f8318    	add	x24, x24, #0x3e0
102aa96f0: aa1803e0    	mov	x0, x24
102aa96f4: 946621b0    	bl	0x104431db4 <dyld_stub_binder+0x104431db4>
102aa96f8: aa1403e0    	mov	x0, x20
102aa96fc: aa1703e1    	mov	x1, x23
102aa9700: aa1603e2    	mov	x2, x22
102aa9704: aa1503e3    	mov	x3, x21
102aa9708: 52800024    	mov	w4, #0x1                ; =1
102aa970c: aa1303e5    	mov	x5, x19
102aa9710: 97ffff1b    	bl	0x102aa937c <_CMa03SUie28mjv+0x43f44>
102aa9714: aa0003f3    	mov	x19, x0
102aa9718: aa1803e0    	mov	x0, x24
102aa971c: 946621a3    	bl	0x104431da8 <dyld_stub_binder+0x104431da8>
102aa9720: aa1303e0    	mov	x0, x19
102aa9724: a9447bfd    	ldp	x29, x30, [sp, #0x40]
102aa9728: a9434ff4    	ldp	x20, x19, [sp, #0x30]
102aa972c: a94257f6    	ldp	x22, x21, [sp, #0x20]
102aa9730: a9415ff8    	ldp	x24, x23, [sp, #0x10]
102aa9734: 910143ff    	add	sp, sp, #0x50
102aa9738: d65f03c0    	ret
