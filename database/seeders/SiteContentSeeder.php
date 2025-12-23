<?php

namespace Database\Seeders;

use App\Models\SiteContent;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        SiteContent::updateOrCreate(
            ['key' => 'home'],
            ['value' => $this->homePayload()]
        );
    }

    private function homePayload(): array
    {
        return [
            'meta' => [
                'title' => 'Dr. Sarah Johnson - Premier Dermatology & Aesthetics',
                'description' => 'Transform your skin with Dr. Sarah Johnson, a board-certified dermatologist specializing in advanced aesthetic treatments and medical dermatology.',
            ],
            'hero' => [
                'badge' => 'Welcome to Excellence',
                'name' => 'Dr. Sarah Johnson',
                'subtitle' => 'Board-Certified Dermatologist',
                'description' => 'Transform your skin with advanced dermatological care and aesthetic excellence. Over 20 years of expertise dedicated to your confidence and natural beauty.',
                'features' => [
                    '20+ Years Experience',
                    'Board Certified',
                    'Advanced Technology',
                ],
                'trust' => [
                    ['value' => '15K+', 'label' => 'Satisfied Patients'],
                    ['value' => '98%', 'label' => 'Success Rate'],
                    ['value' => '20+', 'label' => 'Years of Care'],
                ],
                'image' => [
                    'url' => 'https://mediicc.netlify.app/images/thunb.png',
                    'alt' => 'Dr. Sarah Johnson',
                ],
            ],
            'about' => [
                'title' => 'About Dr. Sarah Johnson',
                'subtitle' => 'Excellence in dermatological care and aesthetic medicine',
                'image' => [
                    'url' => 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80',
                    'alt' => 'Dr. Sarah Johnson',
                ],
                'highlight' => [
                    'value' => '98%',
                    'label' => 'Success Rate',
                ],
                'paragraphs' => [
                    'Dr. Sarah Johnson is a board-certified dermatologist and cosmetic surgeon with over 20 years of experience in transforming the lives of her patients through advanced skincare treatments and aesthetic procedures.',
                    'Graduating with honors from Harvard Medical School, Dr. Johnson has dedicated her career to staying at the forefront of dermatological innovation, combining evidence-based medicine with artistic precision.',
                    'Her patient-centered approach focuses on creating natural, lasting results while prioritizing safety and comfort. Each treatment plan is customized to meet individual goals and skin health needs.',
                ],
                'credentialsTitle' => 'Credentials & Certifications',
                'credentials' => [
                    'MD, Harvard Medical School',
                    'Board Certified, American Academy of Dermatology',
                    'Fellow, American Society for Dermatologic Surgery',
                    'Member, International Society of Cosmetic Dermatology',
                ],
                'stats' => [
                    ['icon' => 'Users', 'value' => '15,000+', 'label' => 'Patients Treated'],
                    ['icon' => 'Award', 'value' => '20+', 'label' => 'Years Experience'],
                    ['icon' => 'Heart', 'value' => '98%', 'label' => 'Patient Satisfaction'],
                    ['icon' => 'BookOpen', 'value' => '50+', 'label' => 'Published Research'],
                ],
            ],
            'services' => [
                'title' => 'Services & Expertise',
                'subtitle' => 'Comprehensive dermatological and aesthetic treatments tailored to your unique needs',
                'items' => [
                    [
                        'icon' => 'Sparkles',
                        'title' => 'Advanced Skin Rejuvenation',
                        'description' => 'Cutting-edge laser treatments, chemical peels, and microneedling to restore youthful, radiant skin.',
                        'treatments' => ['Laser Resurfacing', 'Chemical Peels', 'Microneedling', 'IPL Therapy'],
                    ],
                    [
                        'icon' => 'Syringe',
                        'title' => 'Cosmetic Injectables',
                        'description' => 'Expert administration of dermal fillers and neuromodulators for natural-looking enhancement.',
                        'treatments' => ['Dermal Fillers', 'Botox & Dysport', 'Lip Enhancement', 'Facial Contouring'],
                    ],
                    [
                        'icon' => 'Microscope',
                        'title' => 'Medical Dermatology',
                        'description' => 'Comprehensive diagnosis and treatment of skin conditions, from acne to complex disorders.',
                        'treatments' => ['Acne Treatment', 'Eczema Care', 'Psoriasis Management', 'Skin Cancer Screening'],
                    ],
                    [
                        'icon' => 'Zap',
                        'title' => 'Body Contouring',
                        'description' => 'Non-invasive body sculpting and skin tightening for confidence-boosting transformations.',
                        'treatments' => ['CoolSculpting', 'Radiofrequency Tightening', 'Cellulite Treatment', 'Body Laser'],
                    ],
                ],
            ],
            'caseStudies' => [
                'title' => 'Patient Success Stories',
                'subtitle' => 'Real transformations, real results - ethical presentation of patient journeys',
                'items' => [
                    [
                        'title' => 'Acne Transformation Journey',
                        'category' => 'Medical Dermatology',
                        'duration' => '6 months',
                        'rating' => 5,
                        'story' => 'Patient presented with severe cystic acne affecting self-confidence. Through a personalized combination of prescription treatments and advanced laser therapy, achieved clear, healthy skin.',
                        'results' => [
                            '95% reduction in active breakouts',
                            'Significant improvement in scarring',
                            'Restored confidence and quality of life',
                        ],
                    ],
                    [
                        'title' => 'Age-Defying Skin Renewal',
                        'category' => 'Anti-Aging & Rejuvenation',
                        'duration' => '3 months',
                        'rating' => 5,
                        'story' => 'Patient seeking natural-looking rejuvenation. Combined microneedling, laser resurfacing, and strategic injectable placement for comprehensive facial renewal.',
                        'results' => [
                            'Dramatic improvement in skin texture',
                            'Reduced fine lines and wrinkles',
                            'Natural, refreshed appearance',
                        ],
                    ],
                    [
                        'title' => 'Pigmentation Correction',
                        'category' => 'Laser & Light Therapy',
                        'duration' => '4 months',
                        'rating' => 5,
                        'story' => 'Advanced hyperpigmentation treated with customized laser protocols and medical-grade skincare regimen, resulting in even-toned, radiant complexion.',
                        'results' => [
                            'Even skin tone achieved',
                            'Melasma significantly reduced',
                            'Long-lasting results with maintenance',
                        ],
                    ],
                ],
            ],
            'gallery' => [
                'title' => 'Our Clinic',
                'subtitle' => 'Tour our state-of-the-art facility and comfortable treatment spaces',
                'images' => [
                    [
                        'url' => 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
                        'alt' => 'Modern clinic reception area',
                        'category' => 'Clinic',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80',
                        'alt' => 'Treatment room with advanced equipment',
                        'category' => 'Facilities',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80',
                        'alt' => 'Dr. Johnson consulting with patient',
                        'category' => 'Consultation',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
                        'alt' => 'State-of-the-art laser equipment',
                        'category' => 'Technology',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
                        'alt' => 'Comfortable waiting lounge',
                        'category' => 'Clinic',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80',
                        'alt' => 'Private treatment suite',
                        'category' => 'Facilities',
                    ],
                ],
            ],
            'contact' => [
                'title' => 'Contact & Location',
                'subtitle' => "Get in touch with us - we're here to help with any questions",
                'clinic' => [
                    'name' => 'Johnson Dermatology & Aesthetics',
                    'line1' => '123 Medical Plaza, Suite 500',
                    'line2' => 'Beverly Hills, CA 90210',
                    'line3' => 'United States',
                ],
                'methods' => [
                    [
                        'icon' => 'Phone',
                        'title' => 'Call Us',
                        'value' => '+1 (555) 123-4567',
                        'link' => 'tel:+15551234567',
                        'color' => 'primary',
                    ],
                    [
                        'icon' => 'MessageCircle',
                        'title' => 'WhatsApp',
                        'value' => 'Chat on WhatsApp',
                        'link' => 'https://wa.me/15551234567',
                        'color' => 'accent',
                    ],
                    [
                        'icon' => 'Mail',
                        'title' => 'Email',
                        'value' => 'dr.johnson@clinic.com',
                        'link' => 'mailto:dr.johnson@clinic.com',
                        'color' => 'primary',
                    ],
                ],
                'officeHours' => [
                    ['label' => 'Monday - Friday', 'value' => '9:00 AM - 6:00 PM'],
                    ['label' => 'Saturday', 'value' => '10:00 AM - 4:00 PM'],
                    ['label' => 'Sunday', 'value' => 'Closed'],
                ],
                'mapEmbedUrl' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.4374079384843!2d-118.40168492346382!3d34.063308273156894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bbf2c2d7d7a1%3A0x7e1b2e3f4f5e6d7c!2sBeverly%20Hills%2C%20CA%2090210!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus',
            ],
        ];
    }
}
