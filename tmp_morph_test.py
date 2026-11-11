from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch()
    ctx=b.new_context(viewport={"width":1440,"height":1000}, color_scheme="dark")
    p=ctx.new_page(); errs=[]; p.on("pageerror", lambda e: errs.append(str(e)))
    p.goto("http://127.0.0.1:4173/", wait_until="networkidle"); p.wait_for_timeout(900)
    print("ambient:", p.evaluate("""() => ({live:document.querySelector('.ambient').classList.contains('is-live'), orbs:[...document.querySelectorAll('.ambient__orb')].map(e=>e.className), anim:getComputedStyle(document.querySelector('.ambient__orb--teal')).animationName, spot:getComputedStyle(document.querySelector('.ambient__spot')).opacity})"""))
    p.mouse.move(1100,450); p.wait_for_timeout(600)
    print("ambient moved:", p.evaluate("""() => [...document.querySelectorAll('.ambient__orb')].map(e=>e.style.transform)"""))
    # hover nav
    act=p.locator('.nav-list a[href="achievements.html"]'); box=act.bounding_box(); p.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2); p.wait_for_timeout(450)
    print("nav cursor:", p.evaluate("""() => { const ring=document.querySelector('.cursor-ring'); const dot=document.querySelector('.cursor-dot'); const cs=getComputedStyle(ring); return {ringOpacity:dot.style.opacity, dotOpacity:dot.style.opacity, width:cs.width, height:cs.height, radius:cs.borderRadius, bg:cs.backgroundColor, dotVisible:getComputedStyle(dot).opacity}; }"""))
    p.screenshot(path="tmp_nav_morph.png", full_page=False)
    p.mouse.move(700,700); p.wait_for_timeout(400)
    print("after nav:", p.evaluate("""() => { const ring=document.querySelector('.cursor-ring'); const cs=getComputedStyle(ring); return {width:cs.width,height:cs.height,radius:cs.borderRadius,dot:getComputedStyle(document.querySelector('.cursor-dot')).opacity}; }"""))
    print("errors:", errs)
    ctx.close()
    # light theme
    ctx=b.new_context(viewport={"width":1440,"height":1000}, color_scheme="light")
    p=ctx.new_page(); p.goto("http://127.0.0.1:4173/", wait_until="networkidle"); p.wait_for_timeout(900)
    p.screenshot(path="tmp_light_ambient.png", full_page=False)
    print("light ambient:", p.evaluate("""() => ({live:document.querySelector('.ambient').classList.contains('is-live'), spot:getComputedStyle(document.querySelector('.ambient__spot')).opacity, orbs:[...document.querySelectorAll('.ambient__orb')].map(e=>getComputedStyle(e).backgroundImage.slice(0,80))})"""))
    b.close()
