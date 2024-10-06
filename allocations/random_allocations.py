import requests


new_kids = []

with open('kids.csv') as f:
    kids = f.read().splitlines()
    with open('registered.csv') as r:
        registered_shortcodes = r.read().splitlines()
        registered_shortcodes = [r.lower() for r in registered_shortcodes]
        print(registered_shortcodes)
        no_of_unregistered = 0
        for kid in kids:
            shortcode = kid.split(',')[0]
            name = kid.split(',')[1]
            first_name = name.split(' ')[0]
            last_name = ' '.join(name.split(' ')[1:])
            if shortcode not in registered_shortcodes:
                new_kids.append({
                    "shortcode": shortcode,
                    "firstName": first_name,
                    "lastName": last_name
                })
                no_of_unregistered += 1
                print('Shortcode: {}'.format(shortcode))
                print('First Name: {}'.format(first_name))
                print('Last Name: {}'.format(last_name))
                print()

        print("No of unregistered freshers: {}".format(no_of_unregistered))

for kid in new_kids:
    print(kid)

requests.post('https://mad.docsoc.co.uk/api/signup/random-allocations',
              json=new_kids)
