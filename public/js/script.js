// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })

  const discovery = document.getElementById('listing-discovery')
  if (!discovery) {
    return
  }

  const navbar = document.querySelector('.navbar')
  const navbarSearchSlot = document.getElementById('navbar-search-slot')
  const toolbar = discovery.querySelector('.listing-search-toolbar')
  const toolbarPlaceholder = discovery.querySelector('.listing-search-placeholder')
  const compactSearch = discovery.querySelector('.listing-search-compact')
  const searchForm = discovery.querySelector('.listing-search-form')
  const checkIn = searchForm.querySelector('[name="checkIn"]')
  const checkOut = searchForm.querySelector('[name="checkOut"]')
  const scrollThreshold = 100
  if (checkIn.value) {
    checkOut.min = checkIn.value
  }

  const updateScrollState = () => {
    if (window.scrollY > scrollThreshold) {
      if (toolbar.parentElement !== navbarSearchSlot) {
        navbarSearchSlot.append(toolbar)
      }
      navbar.classList.add('navbar-search-active')
      discovery.classList.add('is-compact')
      discovery.classList.remove('is-expanded')
      compactSearch.setAttribute('aria-expanded', 'false')
    } else {
      if (toolbar.parentElement !== toolbarPlaceholder) {
        toolbarPlaceholder.append(toolbar)
      }
      navbar.classList.remove('navbar-search-active', 'navbar-search-expanded')
      discovery.classList.remove('is-compact', 'is-expanded')
      compactSearch.setAttribute('aria-expanded', 'false')
    }
  }

  let scrollUpdatePending = false
  window.addEventListener('scroll', () => {
    if (!scrollUpdatePending) {
      window.requestAnimationFrame(() => {
        updateScrollState()
        scrollUpdatePending = false
      })
      scrollUpdatePending = true
    }
  }, { passive: true })

  compactSearch.addEventListener('click', () => {
    const isExpanded = discovery.classList.toggle('is-expanded')
    navbar.classList.toggle('navbar-search-expanded', isExpanded)
    compactSearch.setAttribute('aria-expanded', String(isExpanded))
    if (isExpanded) {
      searchForm.querySelector('[name="q"]').focus({ preventScroll: true })
    }
  })

  checkIn.addEventListener('change', () => {
    checkOut.setCustomValidity('')
    checkOut.min = checkIn.value
    if (checkOut.value && checkOut.value <= checkIn.value) {
      checkOut.value = ''
    }
  })

  searchForm.addEventListener('submit', event => {
    const hasCheckIn = Boolean(checkIn.value)
    const hasCheckOut = Boolean(checkOut.value)
    if (hasCheckIn !== hasCheckOut || (hasCheckIn && checkOut.value <= checkIn.value)) {
      event.preventDefault()
      checkOut.setCustomValidity('Choose a check-out date after check-in.')
      checkOut.reportValidity()
      return
    }
    checkOut.setCustomValidity('')
  })

  checkOut.addEventListener('input', () => checkOut.setCustomValidity(''))
  updateScrollState()
})()