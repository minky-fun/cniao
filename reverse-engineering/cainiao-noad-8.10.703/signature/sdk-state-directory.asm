; SDK state directory provenance; fixed executable SHA-256 verified by probe_native.py.
; getSgRootPath -> config +0x28 -> constructor x5 -> SDK +0x20 -> callback +0x70.
; Directory enum 9 is NSDocumentDirectory, domain 1 is NSUserDomainMask.
; The public appended CFString component is SGDocuments.

; sdk-root-path-annotated.asm
; 0x102abab20..0x102ababa0
102abab20: 52800120    	mov	w0, #0x9                ; =9
102abab24: 52800021    	mov	w1, #0x1                ; =1
102abab28: 52800022    	mov	w2, #0x1                ; =1
102abab2c: 9465ce11    	bl	0x10442e370 <dyld_stub_binder+0x10442e370>
102abab30: aa1d03fd    	mov	x29, x29
102abab34: 9465db6e    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102abab38: aa0003f3    	mov	x19, x0
102abab3c: b4000f80    	cbz	x0, 0x102abad2c <_CMa03SUie28mjv+0x558f4>
102abab40: b001bb08    	adrp	x8, 0x10621b000 <dyld_stub_binder+0x10621b000>
102abab44: f9439901    	ldr	x1, [x8, #0x730] ; selector: count
102abab48: aa1303e0    	mov	x0, x19
102abab4c: 9465db3e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102abab50: b4000ee0    	cbz	x0, 0x102abad2c <_CMa03SUie28mjv+0x558f4>
102abab54: b001bce8    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
102abab58: f941a101    	ldr	x1, [x8, #0x340] ; selector: objectAtIndexedSubscript:
102abab5c: aa1303e0    	mov	x0, x19
102abab60: d2800002    	mov	x2, #0x0                ; =0
102abab64: 9465db38    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102abab68: aa1d03fd    	mov	x29, x29
102abab6c: 9465db60    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102abab70: aa0003f5    	mov	x21, x0
102abab74: d001bf28    	adrp	x8, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102abab78: f944c501    	ldr	x1, [x8, #0x988] ; selector: stringByAppendingPathComponent:
102abab7c: 900164a2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102abab80: 9134e042    	add	x2, x2, #0xd38
102abab84: 9465db30    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102abab88: aa1d03fd    	mov	x29, x29
102abab8c: 9465db58    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102abab90: aa0003f4    	mov	x20, x0
102abab94: aa1503e0    	mov	x0, x21
102abab98: 9465db46    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102abab9c: b001bfd8    	adrp	x24, 0x1062b3000 <dyld_stub_binder+0x1062b3000>

; sdk-objectivec-initializer-annotated.asm
; 0x102abb9e0..0x102abb9fc
102abb9e0: d001bbc8    	adrp	x8, 0x106235000 <dyld_stub_binder+0x106235000>
102abb9e4: f9411101    	ldr	x1, [x8, #0x220] ; selector: getSgRootPath
102abb9e8: aa1303e0    	mov	x0, x19
102abb9ec: 9465d796    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102abb9f0: aa1d03fd    	mov	x29, x29
102abb9f4: 9465d7be    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102abb9f8: aa0003fa    	mov	x26, x0
; 0x102abbbec..0x102abbc04
102abbbec: aa1a03e0    	mov	x0, x26
102abbbf0: 9465d739    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102abbbf4: aa1703e1    	mov	x1, x23
102abbbf8: 52800082    	mov	w2, #0x4                ; =4
102abbbfc: 9465d712    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102abbc00: f9000fe0    	str	x0, [sp, #0x18]
; 0x102abbdc4..0x102abbdcc
102abbdc4: f9400fe0    	ldr	x0, [sp, #0x18]
102abbdc8: f81503a0    	stur	x0, [x29, #-0xb0]
; 0x102abbe78..0x102abbe80
102abbe78: d102c3a8    	sub	x8, x29, #0xb0
102abbe7c: a9097fe8    	stp	x8, xzr, [sp, #0x90]
; 0x102abbee0..0x102abbef4
102abbee0: f943c508    	ldr	x8, [x8, #0x788]
102abbee4: 9101a3e1    	add	x1, sp, #0x68
102abbee8: 528520a0    	mov	w0, #0x2905             ; =10501
102abbeec: d2800002    	mov	x2, #0x0                ; =0
102abbef0: d63f0100    	blr	x8

; sdk-native-initializer.asm
; 0x102ae9aa0..0x102ae9aa4
102ae9aa0: f9401628    	ldr	x8, [x17, #0x28]
; 0x102aeb304..0x102aeb310
102aeb304: f940afe5    	ldr	x5, [sp, #0x158]
102aeb308: a94e9be7    	ldp	x7, x6, [sp, #0xe8]
102aeb30c: 97fe1796    	bl	0x102a71164 <_CMa03SUie28mjv+0xbd2c>

; sdk-native-initializer-tail.asm
; 0x102aeb42c..0x102aeb438
102aeb42c: f900a7e8    	str	x8, [sp, #0x148]
102aeb430: f9400108    	ldr	x8, [x8]
102aeb434: f900afe8    	str	x8, [sp, #0x158]
