
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a73878: f94016a8    	ldr	x8, [x21, #0x28]
102a7387c: f9400100    	ldr	x0, [x8]
102a73880: 92800001    	mov	x1, #-0x1               ; =-1
102a73884: 9466f3a3    	bl	0x104430710 <dyld_stub_binder+0x104430710>
102a73888: 3cc082a0    	ldur	q0, [x21, #0x8]
102a7388c: 3d8007e0    	str	q0, [sp, #0x10]
102a73890: f9400682    	ldr	x2, [x20, #0x8]
102a73894: b9401283    	ldr	w3, [x20, #0x10]
102a73898: b9401a81    	ldr	w1, [x20, #0x18]
102a7389c: f94002a0    	ldr	x0, [x21]
102a738a0: f9401c08    	ldr	x8, [x0, #0x38]
102a738a4: 9101c3e4    	add	x4, sp, #0x70
102a738a8: d63f0100    	blr	x8
102a738ac: aa0003f4    	mov	x20, x0
102a738b0: f94012a0    	ldr	x0, [x21, #0x20]
102a738b4: 9466f93d    	bl	0x104431da8 <dyld_stub_binder+0x104431da8>
102a738b8: f94016a8    	ldr	x8, [x21, #0x28]
102a738bc: f9400100    	ldr	x0, [x8]
102a738c0: 9466f391    	bl	0x104430704 <dyld_stub_binder+0x104430704>
102a738c4: 34fffbf4    	cbz	w20, 0x102a73840 <_CMa03SUie28mjv+0xe408>
102a738c8: 528000d5    	mov	w21, #0x6               ; =6
102a738cc: 17ffffa8    	b	0x102a7376c <_CMa03SUie28mjv+0xe334>
102a738d0: 97bd49d2    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>
