
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a71164: d10203ff    	sub	sp, sp, #0x80
102a71168: a9026ffc    	stp	x28, x27, [sp, #0x20]
102a7116c: a90367fa    	stp	x26, x25, [sp, #0x30]
102a71170: a9045ff8    	stp	x24, x23, [sp, #0x40]
102a71174: a90557f6    	stp	x22, x21, [sp, #0x50]
102a71178: a9064ff4    	stp	x20, x19, [sp, #0x60]
102a7117c: a9077bfd    	stp	x29, x30, [sp, #0x70]
102a71180: 9101c3fd    	add	x29, sp, #0x70
102a71184: aa0703f6    	mov	x22, x7
102a71188: aa0603fa    	mov	x26, x6
102a7118c: aa0503f7    	mov	x23, x5
102a71190: aa0403fc    	mov	x28, x4
102a71194: aa0303f8    	mov	x24, x3
102a71198: aa0203f4    	mov	x20, x2
102a7119c: aa0103f5    	mov	x21, x1
102a711a0: aa0003f9    	mov	x25, x0
102a711a4: 52801e00    	mov	w0, #0xf0               ; =240
102a711a8: 9467007e    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102a711ac: aa0003f3    	mov	x19, x0
102a711b0: b4000e80    	cbz	x0, 0x102a71380 <_CMa03SUie28mjv+0xbf48>
102a711b4: b94033a8    	ldr	w8, [x29, #0x30]
102a711b8: b9001fe8    	str	w8, [sp, #0x1c]
102a711bc: f94013a8    	ldr	x8, [x29, #0x20]
102a711c0: f90007e8    	str	x8, [sp, #0x8]
102a711c4: f94017a8    	ldr	x8, [x29, #0x28]
102a711c8: f9000be8    	str	x8, [sp, #0x10]
102a711cc: a94123bb    	ldp	x27, x8, [x29, #0x10]
102a711d0: f90003e8    	str	x8, [sp]
102a711d4: 4f00e400    	movi.16b	v0, #0x0
102a711d8: 3d803a60    	str	q0, [x19, #0xe0]
102a711dc: 3c8d4260    	stur	q0, [x19, #0xd4]
102a711e0: 3c8c4260    	stur	q0, [x19, #0xc4]
102a711e4: 3c8b4260    	stur	q0, [x19, #0xb4]
102a711e8: 3c8a4260    	stur	q0, [x19, #0xa4]
102a711ec: 3c894260    	stur	q0, [x19, #0x94]
102a711f0: 3c884260    	stur	q0, [x19, #0x84]
102a711f4: 3c874260    	stur	q0, [x19, #0x74]
102a711f8: 3c864260    	stur	q0, [x19, #0x64]
102a711fc: 3c854260    	stur	q0, [x19, #0x54]
102a71200: 3c844260    	stur	q0, [x19, #0x44]
102a71204: 3c834260    	stur	q0, [x19, #0x34]
102a71208: 3c824260    	stur	q0, [x19, #0x24]
102a7120c: 3c814260    	stur	q0, [x19, #0x14]
102a71210: 3c804260    	stur	q0, [x19, #0x4]
102a71214: b9000279    	str	w25, [x19]
102a71218: aa1503e0    	mov	x0, x21
102a7121c: 9401ffa4    	bl	0x102af10ac <_CMa03SUie28mjv+0x8bc74>
102a71220: f9000660    	str	x0, [x19, #0x8]
102a71224: b5000060    	cbnz	x0, 0x102a71230 <_CMa03SUie28mjv+0xbdf8>
102a71228: 9401fef3    	bl	0x102af0df4 <_CMa03SUie28mjv+0x8b9bc>
102a7122c: f9000660    	str	x0, [x19, #0x8]
102a71230: aa1403e0    	mov	x0, x20
102a71234: 52800021    	mov	w1, #0x1                ; =1
102a71238: 9401ff18    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a7123c: f9000a60    	str	x0, [x19, #0x10]
102a71240: aa1c03e0    	mov	x0, x28
102a71244: 52800021    	mov	w1, #0x1                ; =1
102a71248: 9401ff14    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a7124c: f9000e60    	str	x0, [x19, #0x18]
102a71250: aa1703e0    	mov	x0, x23
102a71254: 52800021    	mov	w1, #0x1                ; =1
102a71258: 9401ff10    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a7125c: f9001260    	str	x0, [x19, #0x20]
102a71260: aa1a03e0    	mov	x0, x26
102a71264: 52800021    	mov	w1, #0x1                ; =1
102a71268: 9401ff0c    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a7126c: f9001a60    	str	x0, [x19, #0x30]
102a71270: aa1303e0    	mov	x0, x19
102a71274: aa1803e1    	mov	x1, x24
102a71278: aa1703e2    	mov	x2, x23
102a7127c: 9400004a    	bl	0x102a713a4 <_CMa03SUie28mjv+0xbf6c>
102a71280: aa1603e0    	mov	x0, x22
102a71284: 52800021    	mov	w1, #0x1                ; =1
102a71288: 9401ff04    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a7128c: f9004e60    	str	x0, [x19, #0x98]
102a71290: aa1b03e0    	mov	x0, x27
102a71294: 52800021    	mov	w1, #0x1                ; =1
102a71298: 9401ff00    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a7129c: f9005660    	str	x0, [x19, #0xa8]
102a712a0: f94003e0    	ldr	x0, [sp]
102a712a4: 52800021    	mov	w1, #0x1                ; =1
102a712a8: 9401fefc    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a712ac: f9005e60    	str	x0, [x19, #0xb8]
102a712b0: f94007e0    	ldr	x0, [sp, #0x8]
102a712b4: 52800021    	mov	w1, #0x1                ; =1
102a712b8: 9401fef8    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a712bc: f9006660    	str	x0, [x19, #0xc8]
102a712c0: f9400be0    	ldr	x0, [sp, #0x10]
102a712c4: 52800021    	mov	w1, #0x1                ; =1
102a712c8: 9401fef4    	bl	0x102af0e98 <_CMa03SUie28mjv+0x8ba60>
102a712cc: 10001b08    	adr	x8, 0x102a7162c <_CMa03SUie28mjv+0xc1f4>
102a712d0: d503201f    	nop
102a712d4: a90d0268    	stp	x8, x0, [x19, #0xd0]
102a712d8: 10001048    	adr	x8, 0x102a714e0 <_CMa03SUie28mjv+0xc0a8>
102a712dc: d503201f    	nop
102a712e0: 10001089    	adr	x9, 0x102a714f0 <_CMa03SUie28mjv+0xc0b8>
102a712e4: d503201f    	nop
102a712e8: b9401fea    	ldr	w10, [sp, #0x1c]
102a712ec: b900ea6a    	str	w10, [x19, #0xe8]
102a712f0: 1000108a    	adr	x10, 0x102a71500 <_CMa03SUie28mjv+0xc0c8>
102a712f4: d503201f    	nop
102a712f8: 100010cb    	adr	x11, 0x102a71510 <_CMa03SUie28mjv+0xc0d8>
102a712fc: d503201f    	nop
102a71300: a903a668    	stp	x8, x9, [x19, #0x38]
102a71304: 100010e8    	adr	x8, 0x102a71520 <_CMa03SUie28mjv+0xc0e8>
102a71308: d503201f    	nop
102a7130c: 10001129    	adr	x9, 0x102a71530 <_CMa03SUie28mjv+0xc0f8>
102a71310: d503201f    	nop
102a71314: a904ae6a    	stp	x10, x11, [x19, #0x48]
102a71318: 100011aa    	adr	x10, 0x102a7154c <_CMa03SUie28mjv+0xc114>
102a7131c: d503201f    	nop
102a71320: 1000124b    	adr	x11, 0x102a71568 <_CMa03SUie28mjv+0xc130>
102a71324: d503201f    	nop
102a71328: a905a668    	stp	x8, x9, [x19, #0x58]
102a7132c: 100012c8    	adr	x8, 0x102a71584 <_CMa03SUie28mjv+0xc14c>
102a71330: d503201f    	nop
102a71334: 10001369    	adr	x9, 0x102a715a0 <_CMa03SUie28mjv+0xc168>
102a71338: d503201f    	nop
102a7133c: a906ae6a    	stp	x10, x11, [x19, #0x68]
102a71340: a907a668    	stp	x8, x9, [x19, #0x78]
102a71344: 100013c8    	adr	x8, 0x102a715bc <_CMa03SUie28mjv+0xc184>
102a71348: d503201f    	nop
102a7134c: f9004a68    	str	x8, [x19, #0x90]
102a71350: 10001448    	adr	x8, 0x102a715d8 <_CMa03SUie28mjv+0xc1a0>
102a71354: d503201f    	nop
102a71358: f9005268    	str	x8, [x19, #0xa0]
102a7135c: 100014c8    	adr	x8, 0x102a715f4 <_CMa03SUie28mjv+0xc1bc>
102a71360: d503201f    	nop
102a71364: f9005a68    	str	x8, [x19, #0xb0]
102a71368: 10001548    	adr	x8, 0x102a71610 <_CMa03SUie28mjv+0xc1d8>
102a7136c: d503201f    	nop
102a71370: f9006268    	str	x8, [x19, #0xc0]
102a71374: 100016a8    	adr	x8, 0x102a71648 <_CMa03SUie28mjv+0xc210>
102a71378: d503201f    	nop
102a7137c: f9007268    	str	x8, [x19, #0xe0]
102a71380: aa1303e0    	mov	x0, x19
102a71384: a9477bfd    	ldp	x29, x30, [sp, #0x70]
102a71388: a9464ff4    	ldp	x20, x19, [sp, #0x60]
102a7138c: a94557f6    	ldp	x22, x21, [sp, #0x50]
102a71390: a9445ff8    	ldp	x24, x23, [sp, #0x40]
102a71394: a94367fa    	ldp	x26, x25, [sp, #0x30]
102a71398: a9426ffc    	ldp	x28, x27, [sp, #0x20]
102a7139c: 910203ff    	add	sp, sp, #0x80
102a713a0: d65f03c0    	ret


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aeb2f8: b940c3e0    	ldr	w0, [sp, #0xc0]
102aeb2fc: a9560fe1    	ldp	x1, x3, [sp, #0x160]
102aeb300: a95313e2    	ldp	x2, x4, [sp, #0x130]
102aeb304: f940afe5    	ldr	x5, [sp, #0x158]
102aeb308: a94e9be7    	ldp	x7, x6, [sp, #0xe8]
102aeb30c: 97fe1796    	bl	0x102a71164 <_CMa03SUie28mjv+0xbd2c>
102aeb310: 2958a7ea    	ldp	w10, w9, [sp, #0xc4]
102aeb314: 2a2a0128    	orn	w8, w9, w10
102aeb318: 0a0a0129    	and	w9, w9, w10
102aeb31c: 4b0a0129    	sub	w9, w9, w10
102aeb320: 4b080128    	sub	w8, w9, w8
102aeb324: 7100111f    	cmp	w8, #0x4
102aeb328: 54ff5060    	b.eq	0x102ae9d34 <_CMa03SUie28mjv+0x848fc>
102aeb32c: 17fffa79    	b	0x102ae9d10 <_CMa03SUie28mjv+0x848d8>


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ae9d10: 9001f088    	adrp	x8, 0x1068f9000 <dyld_stub_binder+0x1068f9000>
102ae9d14: f9073d00    	str	x0, [x8, #0xe78]
102ae9d18: f9407008    	ldr	x8, [x0, #0xe0]
102ae9d1c: d63f0100    	blr	x8


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aea5d8: f001f068    	adrp	x8, 0x1068f9000 <dyld_stub_binder+0x1068f9000>
102aea5dc: f9473d00    	ldr	x0, [x8, #0xe78]
102aea5e0: 97ff2d12    	bl	0x102ab5a28 <_CMa03SUie28mjv+0x505f0>
