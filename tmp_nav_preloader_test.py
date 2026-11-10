from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch()
    ctx=b.new_context(viewport={"width":1440,"height":950}, color_scheme="dark")
    p=ctx.new_page()
    p.goto("http://127.0.0.1:4173/", wait_until="domcontentloaded")
    first=p.evaluate("""() => ({
      first: document.documentElement.classList.contains('is-first-visit'),
      stored: sessionStorage.getItem('aai-entered'),
      wordDisplay: (() => { const el=document.querySelector('.preloader__word'); return el ? getComputedStyle(el).display : 'preloader already gone'; })()
    })""")
    print("first entry:", first)
    p.wait_for_load_state("networkidle"); p.wait_for_timeout(500)
    nav=p.evaluate("""() => {
      const list=document.getElementById('primary-nav-list');
      const home=list.querySelector('a[aria-current="page"]');
      return {x:list.style.getPropertyValue('--nav-indicator-x'), w:list.style.getPropertyValue('--nav-indicator-w'), active:home && home.textContent.trim(), has:list.classList.contains('has-indicator')};
    }""")
    print("nav initial:", nav)
    # hover activities
    act=p.locator('.nav-list a[href="achievements.html"]')
    box=act.bounding_box(); p.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2); p.wait_for_timeout(450)
    hover=p.evaluate("""() => {
      const list=document.getElementById('primary-nav-list');
      const a=list.querySelector('a[href="achievements.html"]');
      return {x:list.style.getPropertyValue('--nav-indicator-x'), w:list.style.getPropertyValue('--nav-indicator-w'), targetOffset:a.offsetLeft, targetWidth:a.offsetWidth, has:list.classList.contains('has-indicator')};
    }""")
    print("hover activities:", hover)
    p.locator('#site-header').screenshot(path='tmp_nav_hover.png')
    # leave nav
    p.mouse.move(600,500); p.wait_for_timeout(450)
    rest=p.evaluate("""() => {
      const list=document.getElementById('primary-nav-list');
      return {x:list.style.getPropertyValue('--nav-indicator-x'), w:list.style.getPropertyValue('--nav-indicator-w')};
    }""")
    print("mouse leave:", rest)
    # navigate
    p.click('.nav-list a[href="achievements.html"]'); p.wait_for_url("**/achievements.html"); p.wait_for_load_state("networkidle"); p.wait_for_timeout(300)
    second=p.evaluate("""() => {
      const list=document.getElementById('primary-nav-list');
      const d=document.createElement('span'); d.className='preloader__word'; document.body.appendChild(d);
      const display=getComputedStyle(d).display; d.remove();
      return {first: document.documentElement.classList.contains('is-first-visit'), stored: sessionStorage.getItem('aai-entered'), wordDisplay: display, active: list.querySelector('a[aria-current="page"]')?.textContent.trim(), x:list.style.getPropertyValue('--nav-indicator-x')};
    }""")
    print("second page:", second)
    b.close()
