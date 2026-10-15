
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa13dc: d001f2b3    	adrp	x19, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa13e0: f9452268    	ldr	x8, [x19, #0xa40]
102aa13e4: d001f2b5    	adrp	x21, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa13e8: b5000268    	cbnz	x8, 0x102aa1434 <_CMa03SUie28mjv+0x3bffc>
102aa13ec: d2800000    	mov	x0, #0x0                ; =0
102aa13f0: 94664577    	bl	0x1044329cc <dyld_stub_binder+0x1044329cc>
102aa13f4: f9052260    	str	x0, [x19, #0xa40]
102aa13f8: 940000c5    	bl	0x102aa170c <_CMa03SUie28mjv+0x3c2d4>
102aa13fc: 392922a0    	strb	w0, [x21, #0xa48]
102aa1400: b001df28    	adrp	x8, 0x106686000 <_OBJC_EHTYPE_$_NSError+0x162bd0>
102aa1404: f947e508    	ldr	x8, [x8, #0xfc8]
102aa1408: 52800700    	mov	w0, #0x38               ; =56
102aa140c: d63f0100    	blr	x8
102aa1410: b40000e0    	cbz	x0, 0x102aa142c <_CMa03SUie28mjv+0x3bff4>
102aa1414: 4f00e400    	movi.16b	v0, #0x0
102aa1418: ad000000    	stp	q0, q0, [x0]
102aa141c: f900181f    	str	xzr, [x0, #0x30]
102aa1420: 3d800800    	str	q0, [x0, #0x20]
102aa1424: 528000c8    	mov	w8, #0x6                ; =6
102aa1428: b9001c08    	str	w8, [x0, #0x1c]
102aa142c: d001f2a8    	adrp	x8, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa1430: f9052900    	str	x0, [x8, #0xa50]
102aa1434: 396922a8    	ldrb	w8, [x21, #0xa48]
102aa1438: 340014e8    	cbz	w8, 0x102aa16d4 <_CMa03SUie28mjv+0x3c29c>
102aa143c: d2800000    	mov	x0, #0x0                ; =0

Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa16d4: f85c83a8    	ldur	x8, [x29, #-0x38]
102aa16d8: d00148c9    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102aa16dc: f9438d29    	ldr	x9, [x9, #0x718]
102aa16e0: f9400129    	ldr	x9, [x9]
102aa16e4: eb08013f    	cmp	x9, x8
102aa16e8: 54000101    	b.ne	0x102aa1708 <_CMa03SUie28mjv+0x3c2d0>
102aa16ec: d2800000    	mov	x0, #0x0                ; =0
102aa16f0: a94a7bfd    	ldp	x29, x30, [sp, #0xa0]
102aa16f4: a9494ff4    	ldp	x20, x19, [sp, #0x90]
102aa16f8: a94857f6    	ldp	x22, x21, [sp, #0x80]
102aa16fc: a9475ff8    	ldp	x24, x23, [sp, #0x70]
102aa1700: 9102c3ff    	add	sp, sp, #0xb0
102aa1704: d65f03c0    	ret
102aa1708: 97bc9244    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>

Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa170c: d10103ff    	sub	sp, sp, #0x40
102aa1710: a90167fa    	stp	x26, x25, [sp, #0x10]
102aa1714: a9024ff4    	stp	x20, x19, [sp, #0x20]
102aa1718: a9037bfd    	stp	x29, x30, [sp, #0x30]
102aa171c: 9100c3fd    	add	x29, sp, #0x30
102aa1720: 52800228    	mov	w8, #0x11               ; =17
102aa1724: b9000be8    	str	w8, [sp, #0x8]
102aa1728: 910033e8    	add	x8, sp, #0xc
102aa172c: 910023e9    	add	x9, sp, #0x8
102aa1730: 10000027    	adr	x7, 0x102aa1734 <_CMa03SUie28mjv+0x3c2fc>
102aa1734: 9800015a    	ldrsw	x26, 0x102aa175c <_CMa03SUie28mjv+0x3c324>
102aa1738: aa3a03fa    	mvn	x26, x26
102aa173c: aa3a03fa    	mvn	x26, x26
102aa1740: 9102bb5a    	add	x26, x26, #0xae
102aa1744: b9800125    	ldrsw	x5, [x9]
102aa1748: 8b05035a    	add	x26, x26, x5
102aa174c: 8b1a00e7    	add	x7, x7, x26
102aa1750: 528000f0    	mov	w16, #0x7               ; =7
102aa1754: b9000110    	str	w16, [x8]
102aa1758: d61f00e0    	br	x7
102aa175c: ffffff7d    	<unknown>
102aa1760: ba73439a    	<unknown>
102aa1764: 219d051f    	<unknown>
102aa1768: c1560291    	fmls	za.s[w8, 1, vgx2], { z20.s, z21.s }, z6.s[0]
102aa176c: ff7fbd2c    	<unknown>
102aa1770: b9400fe8    	ldr	w8, [sp, #0xc]
102aa1774: d001f2b3    	adrp	x19, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa1778: 39696269    	ldrb	w9, [x19, #0xa58]
102aa177c: 7103551f    	cmp	w8, #0xd5
102aa1780: 7a409924    	ccmp	w9, #0x0, #0x4, ls
102aa1784: 540001a1    	b.ne	0x102aa17b8 <_CMa03SUie28mjv+0x3c380>
102aa1788: d001f2a0    	adrp	x0, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa178c: 91296400    	add	x0, x0, #0xa59
102aa1790: d000ec02    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102aa1794: 910cc042    	add	x2, x2, #0x330
102aa1798: 9000ec23    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102aa179c: 91267063    	add	x3, x3, #0x99c
102aa17a0: 52800181    	mov	w1, #0xc                ; =12
102aa17a4: 52800084    	mov	w4, #0x4                ; =4
102aa17a8: 528006a5    	mov	w5, #0x35               ; =53
102aa17ac: 9466318c    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102aa17b0: 52800028    	mov	w8, #0x1                ; =1
102aa17b4: 39296268    	strb	w8, [x19, #0xa58]
102aa17b8: d001f2b3    	adrp	x19, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa17bc: 39682a68    	ldrb	w8, [x19, #0xa0a]
102aa17c0: 370001a8    	tbnz	w8, #0x0, 0x102aa17f4 <_CMa03SUie28mjv+0x3c3bc>
102aa17c4: d001f2a0    	adrp	x0, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa17c8: 91282c00    	add	x0, x0, #0xa0b
102aa17cc: d000ec02    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102aa17d0: 910c3442    	add	x2, x2, #0x30d
102aa17d4: 9000ec23    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102aa17d8: 91266063    	add	x3, x3, #0x998
102aa17dc: 52800181    	mov	w1, #0xc                ; =12
102aa17e0: 52800084    	mov	w4, #0x4                ; =4
102aa17e4: 52800f25    	mov	w5, #0x79               ; =121
102aa17e8: 9466317a    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102aa17ec: 52800028    	mov	w8, #0x1                ; =1
102aa17f0: 39282a68    	strb	w8, [x19, #0xa0a]
102aa17f4: b0016560    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102aa17f8: 91246000    	add	x0, x0, #0x918
102aa17fc: 946632bf    	bl	0x10442e2f8 <dyld_stub_binder+0x10442e2f8>
102aa1800: aa0003f4    	mov	x20, x0
102aa1804: b0016560    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102aa1808: 9125e000    	add	x0, x0, #0x978
102aa180c: 946632dc    	bl	0x10442e37c <dyld_stub_binder+0x10442e37c>
102aa1810: aa0003f3    	mov	x19, x0
102aa1814: b001bd08    	adrp	x8, 0x106242000 <dyld_stub_binder+0x106242000>
102aa1818: f9445901    	ldr	x1, [x8, #0x8b0]
102aa181c: aa1403e0    	mov	x0, x20
102aa1820: aa1303e2    	mov	x2, x19
102aa1824: 94664008    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102aa1828: 34000160    	cbz	w0, 0x102aa1854 <_CMa03SUie28mjv+0x3c41c>
102aa182c: 97fffd68    	bl	0x102aa0dcc <_CMa03SUie28mjv+0x3b994>
102aa1830: aa1d03fd    	mov	x29, x29
102aa1834: 9466402e    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102aa1838: aa0003f4    	mov	x20, x0
102aa183c: aa1303e1    	mov	x1, x19
102aa1840: 94664001    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102aa1844: aa0003f3    	mov	x19, x0
102aa1848: aa1403e0    	mov	x0, x20
102aa184c: 94664019    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102aa1850: aa1303e0    	mov	x0, x19
102aa1854: a9437bfd    	ldp	x29, x30, [sp, #0x30]
102aa1858: a9424ff4    	ldp	x20, x19, [sp, #0x20]
102aa185c: a94167fa    	ldp	x26, x25, [sp, #0x10]
102aa1860: 910103ff    	add	sp, sp, #0x40
102aa1864: d65f03c0    	ret
