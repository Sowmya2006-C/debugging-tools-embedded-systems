(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const TOOLS=[
{n:"JTAG",t:"Standard debug and test port",h:"Four or five pins (TCK, TMS, TDI, TDO, optional TRST) form a chain of shift registers across the chip. A probe sends commands through the Test Access Port to halt the core, read memory and registers, and flash firmware.",f:"Run control, breakpoints, flash programming, boundary scan, daisy-chaining several chips.",p:"Supported by nearly every processor; also tests solder joints without probes.",c:"Uses more pins than SWD; slower on long chains.",u:"Board bring-up, production testing, FPGA and SoC debugging."},
{n:"SWD",t:"Two-wire debug for ARM",h:"Serial Wire Debug carries the same ARM debug commands as JTAG over just SWDIO (data) and SWCLK (clock). The probe talks to the Debug Access Port to read and write memory and control the core.",f:"Breakpoints, watchpoints, flash access, optional SWO trace output on a third pin.",p:"Saves pins on small packages; fast and cheap probes.",c:"ARM Cortex only; no boundary scan.",u:"Cortex-M microcontrollers in IoT, wearables and consumer devices."},
{n:"UART",t:"Serial console logging",h:"Firmware writes characters out of a TX pin at an agreed baud rate. A USB-serial adapter turns them into text on a terminal. It is printf debugging for hardware.",f:"Status messages, command shells, boot logs, simple two-way control.",p:"Needs only two pins and a few dollars of hardware; works on every chip.",c:"Slows timing-critical code; cannot inspect memory or halt the CPU.",u:"First checks of boot flow, field logging, bootloaders."},
{n:"Oscilloscope",t:"Voltage against time",h:"A probe feeds a signal to an amplifier and a fast converter, and the display plots voltage over time. Triggers lock onto a chosen edge or pulse so a repeating signal holds still.",f:"Analog bandwidth, rise-time measurement, noise and ripple views, protocol decode on many models.",p:"Reveals what the signal really looks like: ringing, glitches, sagging supply.",c:"Usually 2-4 channels; shows no software state.",u:"Power rails, clock quality, PWM and sensor signals, EMI checks."},
{n:"Logic analyzer",t:"Many digital lines at once",h:"Each input is sampled as a simple high or low at a fixed rate and stored in memory. Software then decodes the bit stream into protocols and aligns all channels on one timeline.",f:"8 to 32+ channels, I2C, SPI, UART and CAN decoders, flexible triggers.",p:"Excellent for protocol errors and sequencing across many pins.",c:"No analog detail; sample rate limits what edges it can see.",u:"Sensor communication faults, bus timing, state machines."},
{n:"In-circuit emulator",t:"A stand-in for the CPU",h:"An emulator pod replaces or taps the target processor and reproduces its behaviour while adding hardware breakpoints, memory overlay and trace buffers. The target thinks a real chip is present.",f:"Real-time trace, unlimited breakpoints, memory substitution, bus-level observation.",p:"Deep control with little effect on timing.",c:"Costly, chip-specific, and rarely needed now that on-chip debug is common.",u:"Legacy systems, safety-critical certification, difficult timing faults."},
{n:"Software debugger",t:"Source-level control",h:"Tools such as GDB with OpenOCD, or vendor IDEs, talk to the debug probe. They map machine addresses back to your source lines, so you can set breakpoints, step code and watch variables.",f:"Breakpoints, stepping, call stack, variable and register watch, RTOS awareness.",p:"Fastest way to find logic errors; friendly for beginners.",c:"Halting disturbs real-time behaviour; needs a probe and symbols.",u:"Everyday firmware development across all domains."},
{n:"Trace and profiling",t:"Execution history and timing",h:"Hardware such as ARM ETM or ITM/SWO streams program-flow and event data off-chip while the CPU runs. Software reconstructs what executed and how long each function took.",f:"Instruction trace, function timing, CPU load, interrupt latency, code coverage.",p:"Observes without stopping the system; finds rare and real-time bugs.",c:"Needs trace pins and a faster probe; huge data volumes.",u:"RTOS tuning, power and performance optimisation, certification evidence."}];
const STEPS=[
["Identify the problem","Write down the symptom, when it happens and how to reproduce it. Separate what you saw from what you assume.","Question: does it fail on every board, or only some?"],
["Choose and connect tools","Match the instrument to the suspect: a probe for logic, a scope for signals, a logic analyzer for buses. Share a common ground.","Connect: probe to SWD header, scope to test point TP3"],
["Inspect registers and signals","Read peripheral registers, memory and live waveforms. Compare actual values with the datasheet.","(gdb) x/8xw 0x40021000   # read clock config registers"],
["Form a hypothesis","From the evidence, propose one cause that explains all symptoms. Decide what measurement would prove it wrong.","Hypothesis: SPI clock polarity mismatches the sensor"],
["Find the root cause","Narrow down with breakpoints, watchpoints or trace until the exact line, signal or timing fault is located.","(gdb) watch buffer[16]   # catch the overwrite"],
["Fix the issue","Change one thing at a time. Fix the cause, not the symptom, and note why in the commit message.","CPOL = 1;  /* sensor idles high, see datasheet p.14 */"],
["Test the solution","Repeat the original failure steps, then run regression and long-duration tests. Confirm with the same tool that exposed it.","Result: 10,000 reads, 0 errors, signal clean on scope"]];
const APPS=[["Automotive","Engine control, braking and airbags run on microcontrollers. Engineers use trace, CAN logic analyzers and JTAG to prove deterministic timing before vehicles ship."],["Internet of Things","Battery sensors sleep most of the time. SWD, UART logs and current measurement reveal wake-up faults and wireless stack problems."],["Robotics","Motor control loops need precise timing. Oscilloscopes verify PWM and encoder signals while debuggers tune the control code."],["Industrial automation","PLCs and drives must run for years. Logic analyzers decode fieldbus traffic and trace finds rare faults on the factory floor."],["Medical devices","Pacemakers and infusion pumps demand proven reliability. Trace and coverage tools give the evidence regulators require."],["Consumer electronics","Wearables, cameras and appliances ship in millions. UART, SWD and logic analyzers keep bring-up fast and cheap."],["Aerospace","Flight computers cannot be rebooted mid-flight. In-circuit emulation, trace and exhaustive timing analysis support certification."]];
const FAQ=[["What is an embedded debugger?","It is a probe plus software that connects to a chip's built-in debug logic. It lets you halt the processor, step through code, and read or change memory and registers while the target runs your firmware."],["JTAG vs SWD: which should I use?","Both give full debug access. SWD needs only two signal pins and is standard for ARM Cortex-M. JTAG works across more architectures and supports boundary scan and chains of devices. Use SWD when pins are scarce on ARM, and JTAG when the chip or test plan requires it."],["Oscilloscope vs logic analyzer?","An oscilloscope shows the true analog shape of one to four signals, so it finds noise, slow edges and voltage problems. A logic analyzer records many digital lines and decodes protocols, so it finds wrong data and sequencing. Many problems need both."],["Can I debug without JTAG or SWD?","Yes. Use UART or semihosting logs, toggle spare GPIO pins and watch them on a scope, blink LEDs for state codes, store events in a RAM buffer to dump later, or use the bootloader's serial interface. These are slower and give less insight."],["Which tools should a beginner start with?","Start with a low-cost SWD probe or the one on your development board, a free IDE with GDB, and a USB-serial adapter. Add an 8-channel logic analyzer next, and an entry-level oscilloscope when you meet signal problems."]];

/* nav */
const burger=$(".burger"),menu=$("#menu");
burger.addEventListener("click",()=>{const o=burger.getAttribute("aria-expanded")==="true";burger.setAttribute("aria-expanded",!o);menu.classList.toggle("open",!o)});
menu.addEventListener("click",e=>{if(e.target.tagName==="A"){burger.setAttribute("aria-expanded","false");menu.classList.remove("open")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){burger.setAttribute("aria-expanded","false");menu.classList.remove("open")}});
const links=[...menu.querySelectorAll("a")];
if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+en.target.id))}),{rootMargin:"-45% 0px -50% 0px"});
links.forEach(a=>{const s=$(a.getAttribute("href"));s&&io.observe(s)})}

/* tools */
const rack=$(".rack"),panel=$("#panel");
function showTool(i,focus){[...rack.children].forEach((b,j)=>{b.setAttribute("aria-selected",j===i);b.tabIndex=j===i?0:-1});
const t=TOOLS[i];panel.id="panel";panel.setAttribute("aria-labelledby","tab"+i);panel.style.animation="none";panel.offsetHeight;panel.style.animation="";
panel.innerHTML=`<h3>${t.n}</h3><p class="tag">${t.t}</p><h4>How it works</h4><p>${t.h}</p><div class="cols"><div><h4>Key features</h4><p>${t.f}</p></div><div><h4>Applications</h4><p>${t.u}</p></div><div class="pro"><h4>Advantages</h4><p>${t.p}</p></div><div class="con"><h4>Limitations</h4><p>${t.c}</p></div></div>`;
if(focus)rack.children[i].focus()}
TOOLS.forEach((t,i)=>{const b=document.createElement("button");b.id="tab"+i;b.setAttribute("role","tab");b.setAttribute("aria-controls","panel");b.textContent=t.n;b.addEventListener("click",()=>showTool(i));
b.addEventListener("keydown",e=>{const k=e.key;let n=null;if(k==="ArrowDown"||k==="ArrowRight")n=(i+1)%TOOLS.length;if(k==="ArrowUp"||k==="ArrowLeft")n=(i-1+TOOLS.length)%TOOLS.length;if(n!==null){e.preventDefault();showTool(n,true)}});rack.appendChild(b)});
showTool(0);

/* workflow */
const steps=$("#steps"),detail=$("#stepDetail"),wire=$("#wireOn");
function showStep(i){[...steps.children].forEach((li,j)=>{const b=li.firstChild;b.classList.toggle("done",j<i);j===i?b.setAttribute("aria-current","step"):b.removeAttribute("aria-current")});
const s=STEPS[i];detail.innerHTML=`<h3>Stage ${i+1}: ${s[0]}</h3><p>${s[1]}</p><code>${s[2]}</code>`;wire.style.strokeDashoffset=1-i/(STEPS.length-1)}
STEPS.forEach((s,i)=>{const li=document.createElement("li");li.innerHTML=`<button type="button"><i><b>${i+1}</b></i>${s[0]}</button>`;li.firstChild.addEventListener("click",()=>showStep(i));steps.appendChild(li)});
showStep(0);

/* accordions */
function accordion(host,data,tag){data.forEach((d,i)=>{const wrap=document.createElement(tag);const id=host.id+i;
wrap.innerHTML=`<button type="button" aria-expanded="false" aria-controls="${id}">${tag==="li"?`<strong>${d[0]}</strong><span class="plus" aria-hidden="true">+</span>`:d[0]}</button><div class="${tag==="li"?"more":"ans"}" id="${id}" role="region"><${tag==="li"?"div><p":"p"}>${d[1]}</p>${tag==="li"?"</div>":""}</div>`;
const b=wrap.firstChild,p=wrap.lastChild;b.addEventListener("click",()=>{const o=b.getAttribute("aria-expanded")==="true";b.setAttribute("aria-expanded",!o);p.classList.toggle("open",!o)});host.appendChild(wrap)})}
accordion($("#appList"),APPS,"li");accordion($("#faqList"),FAQ,"div");

/* about fields (saved locally in this browser only) */
document.querySelectorAll(".field").forEach(f=>{const k="dl-"+f.dataset.k;try{f.textContent=localStorage.getItem(k)||""}catch(e){}
f.addEventListener("input",()=>{try{localStorage.setItem(k,f.textContent.trim())}catch(e){}});f.addEventListener("keydown",e=>{if(e.key==="Enter")e.preventDefault()})});

/* footer */
$("#year").textContent=new Date().getFullYear();
$("#totop").addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"});$("#home").setAttribute("tabindex","-1");$("#home").focus({preventScroll:true})});
})();
